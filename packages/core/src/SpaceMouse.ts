import { EventEmitter } from 'events'
import { SpaceMouseEvents, Translation, Rotation, SpaceMouseInfo, ButtonStates } from './api'
import { Product, PRODUCTS, VENDOR_IDS } from './products'
import { getBit, literal } from './lib'
import { HIDDevice } from './genericHIDDevice'

export declare interface SpaceMouse {
	on<U extends keyof SpaceMouseEvents>(event: U, listener: SpaceMouseEvents[U]): this
	emit<U extends keyof SpaceMouseEvents>(event: U, ...args: Parameters<SpaceMouseEvents[U]>): boolean
}

export class SpaceMouse extends EventEmitter {
	private product: Product & { productId: number; interface: number }

	/** All button states */
	private _buttonStates: ButtonStates = new Map()

	private _rotateState: Rotation = {
		pitch: 0,
		roll: 0,
		yaw: 0,
	}
	private _translateState: Translation = {
		x: 0,
		y: 0,
		z: 0,
	}

	private _initialized = false
	private _disconnected = false

	/** Vendor ids for the SpaceMouse devices */
	static get vendorIds(): number[] {
		return VENDOR_IDS
	}

	constructor(private _device: HIDDevice, private _deviceInfo: DeviceInfo, private _devicePath: string | undefined) {
		super()

		this.product = this._setupDevice(_deviceInfo)
	}
	private _setupDevice(deviceInfo: DeviceInfo) {
		const findProduct = (): { product: Product; productId: number; interface: number } => {
			for (const product of Object.values<Product>(PRODUCTS)) {
				if (product.vendorId === deviceInfo.vendorId && product.productId === deviceInfo.productId) {
					return {
						product,
						productId: product.vendorId,
						interface: product.productId,
					}
				}
			}
			// else:
			throw new Error(
				`Unknown/Unsupported SpaceMouse: "${deviceInfo.product}" (vendorId: "${deviceInfo.vendorId}", productId: "${deviceInfo.productId}", interface: "${deviceInfo.interface}").\nPlease report this as an issue on our github page!`
			)
		}
		const found = findProduct()

		this._device.on('data', (data: Buffer) => {
			const messageType = data.readUInt8(0)
			if (messageType === 1) {
				this._handleTranslationData(data)

				if (data.length >= 13) {
					// Some devices send rotation-data in the same message
					// see https://github.com/nytamin/spacemouse/issues/1
					this._handleRotationData(data, 7)
				}
			} else if (messageType === 2) {
				this._handleRotationData(data, 1)
			} else if (messageType === 3) {
				// Note: Assuming that each bit represents a pressed key (I don't know if this is true for all devices)
				for (let byteIndex = 1; byteIndex < data.length; byteIndex++) {
					for (let bitIndex = 0; bitIndex < data.length; bitIndex++) {
						const buttonIndex = (byteIndex - 1) * 8 + bitIndex

						const isDown = Boolean(getBit(data.readUInt8(byteIndex), bitIndex))

						if (isDown) {
							if (!this._buttonStates.get(buttonIndex)) {
								this._buttonStates.set(buttonIndex, true)
								this.emit('down', buttonIndex)
							}
						} else {
							if (this._buttonStates.get(buttonIndex)) {
								this._buttonStates.set(buttonIndex, false)
								this.emit('up', buttonIndex)
							}
						}
					}
				}
			} else {
				// Unknown message
			}
		})

		this._device.on('error', (err) => {
			if ((err + '').match(/could not read from/)) {
				// The device has been disconnected
				this._triggerHandleDeviceDisconnected()
			} else if ((err + '').match(/WebHID disconnected/)) {
				this._triggerHandleDeviceDisconnected()
			} else {
				this.emit('error', err)
			}
		})

		return {
			...found.product,
			productId: found.productId,
			interface: found.interface,
		}
	}
	private _handleTranslationData(data: Buffer): void {
		// Handle incoming data

		const x = data.readInt16LE(1) // positive = right
		const y = data.readInt16LE(3) // positive = "backwards"
		const z = data.readInt16LE(5) // positive = down

		if (x !== this._translateState.x || y !== this._translateState.y || z !== this._translateState.z) {
			this._translateState = { x, y, z }
			this.emit('translate', { x, y, z })
		}
	}
	private _handleRotationData(data: Buffer, firstByteIndex: number): void {
		// Handle incoming data

		const pitch = data.readInt16LE(firstByteIndex) // positive = right
		const roll = data.readInt16LE(firstByteIndex + 2) // positive = "backwards"
		const yaw = data.readInt16LE(firstByteIndex + 4) // positive = down

		if (pitch !== this._rotateState.pitch || roll !== this._rotateState.roll || yaw !== this._rotateState.yaw) {
			this._rotateState = { pitch, roll, yaw }
			this.emit('rotate', { pitch, roll, yaw })
		}
	}

	/** Initialize the device. This ensures that the essential information from the device about its state has been received. */
	public async init(): Promise<void> {
		// Nothing to do here, but keeping this as a placeholder for future use.

		this._initialized = true
	}
	/** Closes the device. Subsequent commands will raise errors. */
	public async close(): Promise<void> {
		await this._handleDeviceDisconnected()
	}

	/** Various information about the device and its capabilities */
	public get info(): SpaceMouseInfo {
		this.ensureInitialized()
		return literal<SpaceMouseInfo>({
			name: this.product.name,

			vendorId: this.product.vendorId,
			productId: this.product.productId,
			interface: this.product.interface,
		})
	}

	/**
	 * Returns an object with current Button states
	 */
	public getButtons(): ButtonStates {
		return new Map(this._buttonStates) // Make a copy
	}

	private _triggerHandleDeviceDisconnected(): void {
		this._handleDeviceDisconnected().catch((error) => {
			this.emit('error', error)
		})
	}
	/** (Internal function) Called when there has been detected that the device has been disconnected */
	public async _handleDeviceDisconnected(): Promise<void> {
		if (!this._disconnected) {
			this._disconnected = true
			await this._device.close()
			this.emit('disconnected')
		}
	}
	public get hidDevice(): HIDDevice {
		return this._device
	}
	public get deviceInfo(): DeviceInfo {
		return this._deviceInfo
	}
	public get devicePath(): string | undefined {
		return this._devicePath
	}

	/** Check that the .init() function has run, throw otherwise */
	private ensureInitialized() {
		if (!this._initialized) throw new Error('SpaceMouse.init() must be run first!')
	}
}
export interface DeviceInfo {
	product: string | undefined
	vendorId: number
	productId: number
	interface: number | null // null means "anything goes", used when interface isn't available
}
