import * as HID from 'node-hid'
/*
 * This file contains internal convenience functions
 */

export function isHID_Device(device: HID.Device | HID.HIDAsync | string): device is HID.Device {
	return (
		typeof device === 'object' &&
		(device as HID.Device).vendorId !== undefined &&
		(device as HID.Device).productId !== undefined &&
		(device as HID.Device).interface !== undefined
	)
}
type HID_AsyncHID = HID.HIDAsync & { devicePath: string }
export function isHID_AsyncHID(device: HID.Device | HID.HIDAsync | string): device is HID_AsyncHID {
	return (
		typeof device === 'object' &&
		device instanceof HID.HIDAsync &&
		(device as HID_AsyncHID).devicePath !== undefined // yes, HID_AsyncHID exposes this, we're using that
	)
}
