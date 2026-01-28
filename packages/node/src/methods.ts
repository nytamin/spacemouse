import { SpaceMouse, PRODUCTS, VENDOR_IDS, Product } from '@spacemouse-lib/core'
import * as HID from 'node-hid'
import type { usb } from 'usb'
import { NodeHIDDevice } from './node-hid-wrapper.js'

import { isHID_Device, isHID_AsyncHID } from './lib.js'

import { HID_Device } from './api.js'

/** Sets up a connection to a HID device (the SpaceMouse device) */
export function setupSpaceMouse(): Promise<SpaceMouse>
export function setupSpaceMouse(HIDDevice: HID.Device): Promise<SpaceMouse>
export function setupSpaceMouse(HIDDevice: HID.HIDAsync): Promise<SpaceMouse>
export function setupSpaceMouse(devicePath: string): Promise<SpaceMouse>
export async function setupSpaceMouse(devicePathOrHIDDevice?: HID.Device | HID.HIDAsync | string): Promise<SpaceMouse> {
	let devicePath: string
	let device: HID.HIDAsync
	let deviceInfo:
		| {
				product: string | undefined
				vendorId: number
				productId: number
				interface: number
		  }
		| undefined

	if (!devicePathOrHIDDevice) {
		// Device not provided, will then select any connected device:
		const connectedSpaceMouse = listAllConnectedDevices()
		if (!connectedSpaceMouse.length) {
			throw new Error('Could not find any connected SpaceMouse devices.')
		}
		// Just select the first one:
		devicePath = connectedSpaceMouse[0].path
		device = await HID.HIDAsync.open(devicePath)

		deviceInfo = {
			product: connectedSpaceMouse[0].product,
			vendorId: connectedSpaceMouse[0].vendorId,
			productId: connectedSpaceMouse[0].productId,
			interface: connectedSpaceMouse[0].interface,
		}
	} else if (isHID_Device(devicePathOrHIDDevice)) {
		// is HID.Device

		if (!devicePathOrHIDDevice.path) throw new Error('HID.Device path not set!')

		devicePath = devicePathOrHIDDevice.path
		device = await HID.HIDAsync.open(devicePath)

		deviceInfo = {
			product: devicePathOrHIDDevice.product,
			vendorId: devicePathOrHIDDevice.vendorId,
			productId: devicePathOrHIDDevice.productId,
			interface: devicePathOrHIDDevice.interface,
		}
	} else if (isHID_AsyncHID(devicePathOrHIDDevice)) {
		// is HID.HIDAsync

		device = devicePathOrHIDDevice
		devicePath = devicePathOrHIDDevice.devicePath
		// deviceInfo is set later
	} else if (typeof devicePathOrHIDDevice === 'string') {
		// is string (path)

		devicePath = devicePathOrHIDDevice
		device = await HID.HIDAsync.open(devicePath)
		// deviceInfo is set later
	} else {
		throw new Error(`setupSpaceMouse: invalid arguments: ${JSON.stringify(devicePathOrHIDDevice)}`)
	}

	if (!deviceInfo) {
		// Look through HID.devices(), because HID.Device contains the productId
		for (const hidDevice of HID.devices()) {
			if (hidDevice.path === devicePath) {
				deviceInfo = {
					product: hidDevice.product,
					vendorId: hidDevice.vendorId,
					productId: hidDevice.productId,
					interface: hidDevice.interface,
				}
				break
			}
		}
	}

	if (!device) throw new Error('Error setting up SpaceMouse: device not found')
	if (!devicePath) throw new Error('Error setting up SpaceMouse: devicePath not found')
	if (!deviceInfo) throw new Error('Error setting up SpaceMouse: deviceInfo not found')

	const deviceWrap = new NodeHIDDevice(device)

	const spaceMouse = new SpaceMouse(deviceWrap, deviceInfo, devicePath)

	// Wait for the device to initialize:
	await spaceMouse.init()

	return spaceMouse
}
/** Returns a list of all connected SpaceMouse-HID-devices */
export function listAllConnectedDevices(): HID_Device[] {
	const connectedSpaceMouse = HID.devices().filter((device) => {
		// Filter to only return the supported devices:
		return isASpaceMouseDevice(device)
	})
	return connectedSpaceMouse as HID_Device[]
}
/** Returns a list of all connected SpaceMouse-HID-devices */
export function isASpaceMouseDevice(device: HID.Device | usb.Device): boolean {
	let vendorId: number
	let productId: number

	if (isUSBDevice(device)) {
		vendorId = device.deviceDescriptor.idVendor
		productId = device.deviceDescriptor.idProduct
	} else {
		vendorId = device.vendorId
		productId = device.productId
		if (!device.path) return false
	}

	if (!VENDOR_IDS.includes(vendorId)) return false

	for (const product of Object.values<Product>(PRODUCTS)) {
		if (product.productId === productId && product.vendorId === vendorId) {
			return true // break and return
		}
	}
	return false
}
export function isUSBDevice(device: HID.Device | usb.Device): device is usb.Device {
	return 'deviceDescriptor' in device
}
