import type { usb } from 'usb'
import { EventEmitter } from 'events'
import { SpaceMouse } from '@spacemouse-lib/core'
import { isASpaceMouseDevice, listAllConnectedDevices, setupSpaceMouse } from './methods.js'

let USBImport: typeof usb | undefined
let hasTriedImport = false

// Because usb is an optional dependency, we have to use in a somewhat messy way:
async function USBDetect(): Promise<typeof usb> {
	if (USBImport) return USBImport

	if (!hasTriedImport) {
		hasTriedImport = true
		try {
			// const usb: typeof import('usb') = import('usb')
			const usb = await import('usb')
			USBImport = usb.usb
			return USBImport
		} catch {
			// It's not installed
		}
	}
	// else emit error:
	throw new Error(`SpaceMouseWatcher requires the dependency "usb" to be installed when not polling.
It might have been skipped due to your platform being unsupported (this is an issue with "usb", not the SpaceMouse library).
Possible solutions are:
* You can try to install the dependency manually, by running "npm install usb".
* Use the fallback "usePolling" functionality instead: new SpaceMouseWatcher({ usePolling: true})
* Otherwise you can still connect to SpaceMouse devices manually by using SpaceMouse.setupDevices().
`)
}

export interface SpaceMouseWatcherEvents {
	// Note: This interface defines strong typings for any events that are emitted by the SpaceMouseWatcher class.

	connected: [spaceMouse: SpaceMouse]
	error: [err: any]
}

/**
 * Set up a watcher for newly connected SpaceMouse devices.
 * Note: It is highly recommended to set up a listener for the disconnected event on the SpaceMouse device, to clean up after a disconnected device.
 */
export class SpaceMouseWatcher extends EventEmitter<SpaceMouseWatcherEvents> {
	private seenDevicePaths: {
		[devicePath: string]: {
			spaceMouse?: SpaceMouse
		}
	} = {}
	private isMonitoring = true
	private updateConnectedDevicesTimeout: NodeJS.Timeout | null = null
	private updateConnectedDevicesIsRunning = false
	private updateConnectedDevicesRunAgain = false
	private shouldFindChangedReTries = 0

	public debug = false
	/** A list of the devices we've called setupSpaceMice for */
	private setupSpaceMice: SpaceMouse[] = []
	private pollingInterval: NodeJS.Timeout | undefined = undefined

	constructor(private options?: SpaceMouseWatcherOptions) {
		super()

		if (!this.options?.usePolling) {
			// Watch for added devices:

			USBDetect()
				.then((usb) => {
					usb.on('attach', this.onAddedUSBDevice)
					usb.on('detach', this.onRemovedUSBDevice)
				})
				.catch(console.error)
		} else {
			this.pollingInterval = setInterval(() => {
				this.triggerUpdateConnectedDevices(true)
			}, this.options?.pollingInterval ?? 1000)
		}

		// Also do a sweep for all currently connected SpaceMouse devices:
		this.triggerUpdateConnectedDevices(true)
	}
	/**
	 * Stop the watcher
	 * @param closeAllDevices Set to false in order to NOT close all devices. Use this if you only want to stop the watching. Defaults to true
	 */
	public async stop(closeAllDevices = true): Promise<void> {
		this.isMonitoring = false

		if (!this.options?.usePolling) {
			// Remove the listeners:
			USBDetect()
				.then((usb) => {
					usb.off('attach', this.onAddedUSBDevice)
					usb.off('detach', this.onRemovedUSBDevice)
				})
				.catch(console.error)
		}

		if (this.pollingInterval) {
			clearInterval(this.pollingInterval)
			this.pollingInterval = undefined
		}

		if (closeAllDevices) {
			// In order for an application to close gracefully,
			// we need to close all devices that we've called setupSpaceMouse() on:
			const ps: Promise<void>[] = []
			for (const spaceMouse of this.setupSpaceMice) {
				ps.push(spaceMouse.close())
			}
			await Promise.all(ps)
		}
	}
	private onAddedUSBDevice = (usbDevice: usb.Device) => {
		if (isASpaceMouseDevice(usbDevice)) {
			// Called whenever a new USB device is added
			this.debugLog('onAddedUSBDevice')
			if (this.isMonitoring) {
				this.shouldFindChangedReTries++
				this.triggerUpdateConnectedDevices(true)
			}
		}
	}
	private onRemovedUSBDevice = (usbDevice: usb.Device) => {
		if (isASpaceMouseDevice(usbDevice)) {
			// Called whenever a new USB device is removed
			this.debugLog('onRemovedUSBDevice')
			if (this.isMonitoring) {
				this.shouldFindChangedReTries++
				this.triggerUpdateConnectedDevices(true)
			}
		}
	}
	private triggerUpdateConnectedDevices(asap: boolean): void {
		if (this.updateConnectedDevicesIsRunning) {
			// It is already running, so we'll run it again later, when it's done:
			this.updateConnectedDevicesRunAgain = true
			return
		} else if (this.updateConnectedDevicesTimeout) {
			// It is already scheduled to run.

			if (asap) {
				// Set it to run now:
				clearTimeout(this.updateConnectedDevicesTimeout)
				this.updateConnectedDevicesTimeout = null
			} else {
				return
			}
		}

		if (!this.updateConnectedDevicesTimeout) {
			this.updateConnectedDevicesRunAgain = false
			this.updateConnectedDevicesTimeout = setTimeout(
				() => {
					this.updateConnectedDevicesTimeout = null
					this.updateConnectedDevicesIsRunning = true

					this.updateConnectedDevices()
						.catch(console.error)
						.finally(() => {
							this.updateConnectedDevicesIsRunning = false
							if (this.updateConnectedDevicesRunAgain) this.triggerUpdateConnectedDevices(true)
						})
				},
				asap ? 10 : 1000
			)
		}
	}
	private async updateConnectedDevices(): Promise<void> {
		const pathMap: { [devicePath: string]: true } = {}

		this.debugLog('updateConnectedDevices')
		// Note:
		// This implementation is a bit awkward,
		// there isn't a good way to relate the output from usb to node-hid devices
		// So we're just using the events to trigger a re-check for new devices and cache the seen devices

		listAllConnectedDevices().forEach((spaceMouseDevice) => {
			if (spaceMouseDevice.path) {
				pathMap[spaceMouseDevice.path] = true
			} else {
				this.emit('error', `SpaceMouseWatcher: Device missing path.`)
			}
		})

		let removed = 0
		let added = 0
		// Removed devices:
		for (const [devicePath, o] of Object.entries<{ spaceMouse?: SpaceMouse }>(this.seenDevicePaths)) {
			if (!pathMap[devicePath]) {
				// A device has been removed
				this.debugLog('removed')
				removed++
				if (o.spaceMouse) await this.handleRemovedDevice(o.spaceMouse)

				delete this.seenDevicePaths[devicePath]
			}
		}
		// Added devices:
		for (const devicePath of Object.keys(pathMap)) {
			if (!this.seenDevicePaths[devicePath]) {
				// A device has been added
				this.debugLog('added')
				added++
				this.seenDevicePaths[devicePath] = {}
				this.handleNewDevice(devicePath)
			}
		}
		if (this.shouldFindChangedReTries > 0 && (added === 0 || removed === 0)) {
			// We expected to find something changed, but didn't.
			// Try again later:
			this.shouldFindChangedReTries--
			this.triggerUpdateConnectedDevices(false)
		} else {
			this.shouldFindChangedReTries = 0
		}
	}
	private handleNewDevice(devicePath: string): void {
		this.debugLog('handleNewDevice', devicePath)

		setupSpaceMouse(devicePath)
			.then(async (spaceMouse: SpaceMouse) => {
				this.setupSpaceMice.push(spaceMouse)
				// Since this is async, check if the device is still connected
				if (this.seenDevicePaths[devicePath]) {
					// yes, it is still connected

					// Listen to the disconnected event, because often if comes faster from the SpaceMouse than from this watcher.
					const onDisconnected = () => {
						delete this.seenDevicePaths[devicePath]
						spaceMouse.removeListener('disconnected', onDisconnected)
					}
					spaceMouse.on('disconnected', onDisconnected)

					// Store for future reference:
					this.seenDevicePaths[devicePath].spaceMouse = spaceMouse

					this.emit('connected', spaceMouse)
				} else {
					await this.handleRemovedDevice(spaceMouse)
				}
			})
			.catch((err) => {
				this.emit('error', err)
			})
	}
	private async handleRemovedDevice(spaceMouse: SpaceMouse) {
		await spaceMouse._handleDeviceDisconnected()
	}
	private debugLog(...args: any[]) {
		if (this.debug) console.log(...args)
	}
}
export interface SpaceMouseWatcherOptions {
	/** If set, will use polling for devices instead of watching for them directly. Might be a bit slower, but is more compatible. */
	usePolling?: boolean
	/** If usePolling is set, the interval to use for checking for new devices. */
	pollingInterval?: number
}
