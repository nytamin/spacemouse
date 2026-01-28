import EventEmitter from 'node:events'

/**
 * The expected interface for a HIDDevice.
 * This is to be implemented by any wrapping libraries to translate their platform specific devices into a common and simpler form
 */
export interface HIDDevice extends EventEmitter<HIDDeviceEvents> {
	// write(data: number[]): void // No writes implemented (yet)

	close(): Promise<void>
}
export interface HIDDeviceEvents {
	error: [data: any]
	data: [data: Buffer]
}
