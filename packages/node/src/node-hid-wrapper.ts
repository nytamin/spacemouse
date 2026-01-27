/* eslint-disable @typescript-eslint/unbound-method */
import { HIDDevice } from '@spacemouse-lib/core'
import { EventEmitter } from 'events'
import * as HID from 'node-hid'

/**
 * This class wraps the node-hid.HID Device.
 * This translates it into the common format (@see HIDDevice) defined by @spacemouse-lib/core
 */
export class NodeHIDDevice extends EventEmitter implements HIDDevice {
	constructor(private device: HID.HIDAsync) {
		super()
		this._handleData = this._handleData.bind(this)
		this._handleError = this._handleError.bind(this)

		this.device.on('error', this._handleError)
		this.device.on('data', this._handleData)
	}

	// public write(data: number[]): void {
	// 	this.device.write(data).catch(() =>)
	// }

	public async close(): Promise<void> {
		this.device.removeListener('data', this._handleData)
		this.device.removeListener('error', this._handleError)

		await this.device.close()
	}

	private _handleData(data: Buffer) {
		this.emit('data', data)
	}
	private _handleError(error: any) {
		this.emit('error', error)
	}
}
