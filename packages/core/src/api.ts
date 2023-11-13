/*
 * This file contains public type interfaces.
 * If changing these, consider whether it might be a breaking change.
 */
export type ButtonStates = Map<number, boolean>

export interface Translation {
	x: number
	y: number
	z: number
}
export interface Rotation {
	pitch: number
	roll: number
	yaw: number
}

export interface SpaceMouseEvents {
	// Note: This interface defines strong typings for any events that are emitted by the SpaceMouse class.

	translate: (translation: Translation) => void
	rotate: (rotation: Rotation) => void

	down: (keyIndex: number) => void
	up: (keyIndex: number) => void

	disconnected: () => void
	reconnected: () => void
	error: (err: any) => void
}
export interface SpaceMouseInfo {
	/** Name of the device */
	name: string

	/** Vendor id of the HID device */
	vendorId: number
	/** Product id of the HID device */
	productId: number
	/** Interface number of the HID device */
	interface: number
}
