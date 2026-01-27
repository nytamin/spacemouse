/* eslint-disable @typescript-eslint/unbound-method */
import { HIDDevice as CoreHIDDevice } from '@spacemouse-lib/core'
import { EventEmitter } from 'events'
import { Buffer as WebBuffer } from 'buffer'

/**
 * The wrapped browser HIDDevice.
 * This translates it into the common format (@see CoreHIDDevice) defined by @spacemouse-lib/core
 */
export class WebHIDDevice extends EventEmitter implements CoreHIDDevice {
	private readonly device: HIDDevice

	constructor(device: HIDDevice) {
		super()

		this._handleInputReport = this._handleInputReport.bind(this)
		this._handleError = this._handleError.bind(this)
		this._handleDisconnect = this._handleDisconnect.bind(this)

		this.device = device

		this.device.addEventListener('inputreport', this._handleInputReport)
		this.device.addEventListener('error', this._handleError)
		navigator.hid.addEventListener('disconnect', this._handleDisconnect)
	}
	public async close(): Promise<void> {
		await this.device.close()
		this._cleanup()
	}
	// No writes implemented (yet)
	// public write(data: number[]): void {
	// 	this.reportQueue
	// 		.add(async () => {
	// 			await this.device.sendReport(data[0], new Uint8Array(data.slice(1)))
	// 		})
	// 		.catch((err) => {
	// 			this.emit('error', err)
	// 		})
	// }
	private _cleanup(): void {
		this.device.removeEventListener('inputreport', this._handleInputReport)
		this.device.removeEventListener('error', this._handleError)
		navigator.hid.removeEventListener('disconnect', this._handleDisconnect)
	}

	private _handleInputReport(event: HIDInputReportEvent) {
		const buf = WebBuffer.concat([WebBuffer.from([event.reportId]), WebBuffer.from(event.data.buffer)])
		this.emit('data', buf)
	}
	private _handleError(error: any) {
		this.emit('error', error)
	}
	private _handleDisconnect(event: HIDConnectionEvent) {
		if (event.device === this.device) {
			this.emit('error', 'WebHID disconnected')
		}
		this._cleanup()
	}
}
