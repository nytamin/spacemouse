import { expect, test, vi } from 'vitest'
import { EventEmitter } from 'events'
import { PRODUCTS } from '../products.js'
import { HIDDevice } from '../genericHIDDevice.js'
import { DeviceInfo, SpaceMouse } from '../SpaceMouse.js'

class MockHIDDevice extends EventEmitter implements HIDDevice {
	async close(): Promise<void> {
		return Promise.resolve()
	}
	mockEmitData(data: Buffer) {
		this.emit('data', data)
	}
}
function buf(input: string): Buffer {
	// Input is like: '01 00 00 00 00 34 00'
	const bytes = input.split(' ').map((b) => parseInt(b, 16))
	return Buffer.from(bytes)
}

test('SpaceNavigator', async () => {
	const mockHID = new MockHIDDevice()
	const product = PRODUCTS.SpaceNavigator
	const deviceInfo: DeviceInfo = {
		product: product.name,
		vendorId: product.vendorId,
		productId: product.productId,
		interface: 0,
	}
	const device = new SpaceMouse(mockHID, deviceInfo, 'mockPath')

	await device.init()

	const downHandler = vi.fn()
	const upHandler = vi.fn()
	const rotateHandler = vi.fn()
	const translateHandler = vi.fn()
	device.on('down', downHandler)
	device.on('up', upHandler)
	device.on('rotate', rotateHandler)
	device.on('translate', translateHandler)

	// Simulate some incoming data:
	// Initial state:
	mockHID.mockEmitData(buf('01 00 00 00 00 00 00'))
	mockHID.mockEmitData(buf('02 00 00 00 00 00 00'))
	expect(rotateHandler).not.toBeCalled()
	expect(translateHandler).not.toBeCalled()

	// Pushing the spacemouse down:
	mockHID.mockEmitData(buf('01 00 00 00 00 34 00'))
	mockHID.mockEmitData(buf('02 00 00 00 00 00 00'))
	expect(downHandler).not.toBeCalled()
	expect(rotateHandler).not.toBeCalled()
	expect(translateHandler).toBeCalledTimes(1)
	expect(translateHandler).toBeCalledWith({ x: 0, y: 0, z: 52 })
	translateHandler.mockClear()

	// Back to zero:
	mockHID.mockEmitData(buf('01 00 00 00 00 00 00'))
	mockHID.mockEmitData(buf('02 00 00 00 00 00 00'))
	expect(rotateHandler).not.toBeCalled()
	expect(translateHandler).toBeCalledTimes(1)
	expect(translateHandler).toBeCalledWith({ x: 0, y: 0, z: 0 })
	translateHandler.mockClear()

	// Rotate the spacemouse clockwise:
	mockHID.mockEmitData(buf('01 00 00 00 00 00 00'))
	mockHID.mockEmitData(buf('02 00 00 00 00 2d 00'))
	expect(translateHandler).not.toBeCalled()
	expect(rotateHandler).toBeCalledTimes(1)
	expect(rotateHandler).toBeCalledWith({ pitch: 0, roll: 0, yaw: 45 })
	rotateHandler.mockClear()

	// Back to zero:
	mockHID.mockEmitData(buf('01 00 00 00 00 00 00'))
	mockHID.mockEmitData(buf('02 00 00 00 00 00 00'))
	expect(translateHandler).not.toBeCalled()
	expect(rotateHandler).toBeCalledTimes(1)
	expect(rotateHandler).toBeCalledWith({ pitch: 0, roll: 0, yaw: 0 })
	rotateHandler.mockClear()

	// Final check:
	expect(rotateHandler).not.toBeCalled()
	expect(translateHandler).not.toBeCalled()
	expect(downHandler).not.toBeCalled()
	expect(upHandler).not.toBeCalled()
})
test('SpaceMouse Wireless', async () => {
	const mockHID = new MockHIDDevice()
	const product = PRODUCTS.SpaceMouse_Wireless // possibly SpaceMouse_Wireless_2 ?
	const deviceInfo: DeviceInfo = {
		product: product.name,
		vendorId: product.vendorId,
		productId: product.productId,
		interface: 0,
	}
	const device = new SpaceMouse(mockHID, deviceInfo, 'mockPath')

	await device.init()

	const downHandler = vi.fn()
	const upHandler = vi.fn()
	const rotateHandler = vi.fn()
	const translateHandler = vi.fn()
	device.on('down', downHandler)
	device.on('up', upHandler)
	device.on('rotate', rotateHandler)
	device.on('translate', translateHandler)

	// Simulate some incoming data:
	// Initial state:
	mockHID.mockEmitData(buf('01 00 00 00 00 00 00 00 00 00 00 00 00'))
	expect(rotateHandler).not.toBeCalled()
	expect(translateHandler).not.toBeCalled()

	// Pushing the SpaceMouse down:
	mockHID.mockEmitData(buf('01 00 00 00 00 19 00 00 00 00 00 00 00'))
	expect(rotateHandler).not.toBeCalled()
	expect(translateHandler).toBeCalledTimes(1)
	expect(translateHandler).toBeCalledWith({ x: 0, y: 0, z: 25 })
	translateHandler.mockClear()

	// Back to zero:
	mockHID.mockEmitData(buf('01 00 00 00 00 00 00 00 00 00 00 00 00'))
	expect(rotateHandler).not.toBeCalled()
	expect(translateHandler).toBeCalledTimes(1)
	expect(translateHandler).toBeCalledWith({ x: 0, y: 0, z: 0 })
	translateHandler.mockClear()

	// Not sure what this message means, but it's in the logs:
	mockHID.mockEmitData(buf('17 64 01'))
	expect(rotateHandler).not.toBeCalled()
	expect(translateHandler).not.toBeCalled()
	expect(downHandler).not.toBeCalled()
	expect(upHandler).not.toBeCalled()

	// Rotating clockwise
	mockHID.mockEmitData(buf('01 00 00 00 00 00 00 00 00 00 00 30 00'))
	expect(translateHandler).not.toBeCalled()
	expect(rotateHandler).toBeCalledTimes(1)
	expect(rotateHandler).toBeCalledWith({ pitch: 0, roll: 0, yaw: 48 })
	rotateHandler.mockClear()

	// Final check:
	expect(rotateHandler).not.toBeCalled()
	expect(translateHandler).not.toBeCalled()
	expect(downHandler).not.toBeCalled()
	expect(upHandler).not.toBeCalled()
})
