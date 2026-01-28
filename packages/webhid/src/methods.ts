import { SpaceMouse, PRODUCTS, Product } from '@spacemouse-lib/core'
import { WebHIDDevice } from './web-hid-wrapper.js'

/** Prompts the user for which SpaceMouse device to select */
export async function requestSpaceMice(): Promise<HIDDevice[]> {
	return window.navigator.hid.requestDevice({
		filters: Object.values<Product>(PRODUCTS).map((product) => ({
			vendorId: product.vendorId,
			productId: product.productId,
		})),
	})
}
/**
 * Reopen previously selected devices.
 * The browser remembers what the user previously allowed your site to access, and this will open those without the request dialog
 */
export async function getOpenedSpaceMice(): Promise<HIDDevice[]> {
	return await window.navigator.hid.getDevices()
}

/** Sets up a connection to a HID device (the SpaceMouse device) */
export async function setupSpaceMouse(browserDevice: HIDDevice): Promise<SpaceMouse> {
	if (!browserDevice?.collections?.length) throw Error(`device collections is empty`)
	if (!browserDevice.productId) throw Error(`Device has no productId!`)

	if (!browserDevice.opened) {
		await browserDevice.open()
	}

	const deviceWrap = new WebHIDDevice(browserDevice)

	const spaceMouse = new SpaceMouse(
		deviceWrap,
		{
			product: browserDevice.productName,
			vendorId: browserDevice.vendorId,
			productId: browserDevice.productId,
			interface: null, // todo: Check what to use here (collection.usage?)
		},
		undefined
	)

	// Wait for the device to initialize:
	await spaceMouse.init()

	return spaceMouse
}
