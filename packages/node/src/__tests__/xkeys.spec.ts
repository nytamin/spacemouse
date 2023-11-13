import * as HID from 'node-hid'
import * as HIDMock from '../__mocks__/node-hid'
import { PRODUCTS, Rotation, setupSpaceMouse } from '../'
import { getSentData, handleSpaceMouseMessages, resetSentData } from './lib'
import { getMockHIDDevices } from '../__mocks__/node-hid'
import { Translation } from '@spacemouse-lib/core'

describe('Unit tests', () => {
	test('SpaceMouse methods', async () => {
		// const device = new SpaceMouse()

		const hidDevice = {
			vendorId: PRODUCTS['SpaceNavigator'].vendorId,
			productId: PRODUCTS['SpaceNavigator'].productId,
			interface: 0,
			path: 'mockPath',
		} as HID.Device

		HIDMock.setMockWriteHandler(handleSpaceMouseMessages)

		const myspaceMouse = await setupSpaceMouse(hidDevice)

		const onError = jest.fn(console.log)

		myspaceMouse.on('error', onError)

		let rotate: Rotation = {
			pitch: 0,
			roll: 0,
			yaw: 0,
		}
		myspaceMouse.on('rotate', (r) => {
			rotate = r
		})
		let translate: Translation = {
			x: 0,
			y: 0,
			z: 0,
		}
		myspaceMouse.on('translate', (t) => {
			translate = t
		})

		resetSentData()

		resetSentData()
		expect(myspaceMouse.info).toMatchSnapshot()
		resetSentData()
		myspaceMouse.getButtons()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()

		const mockHIDs = getMockHIDDevices()
		expect(mockHIDs).toHaveLength(1)
		const mockHID = mockHIDs[0]

		// Rotation:
		mockHID.emit('data', Buffer.from([0x02, 0x32, 0x00, 0xff, 0xff, 0x8b, 0x00]))
		expect(onError).toHaveBeenCalledTimes(0)
		expect(rotate).toEqual({
			pitch: 50,
			roll: -1,
			yaw: 139,
		})
		// Translation:
		mockHID.emit('data', Buffer.from([0x01, 0x1b, 0x00, 0x15, 0x00, 0x5e, 0x01]))
		expect(onError).toHaveBeenCalledTimes(0)
		expect(translate).toEqual({
			x: 27,
			y: 21,
			z: 350,
		})
	})
})
