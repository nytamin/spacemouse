// const { setupSpaceMouse, listAllConnectedDevices } = require('spacemouse-node')
const { setupSpaceMouse, listAllConnectedDevices } = require('../dist')// nocommit tmp

/*
	This example shows how to use setupSpaceMouse()
	directly, instead of going via SpaceMouseWatcher()
*/

// Connect to an spaceMouse-device:
setupSpaceMouse()
	.then((spaceMouse) => {
		spaceMouse.on('disconnected', () => {
			console.log(`SpaceMouse device of type ${spaceMouse.info.name} was disconnected`)
			// Clean up stuff
			spaceMouse.removeAllListeners()
		})
		spaceMouse.on('error', (...errs) => {
			console.log('SpaceMouse error:', ...errs)
		})

		spaceMouse.on('down', (keyIndex, metadata) => {
			console.log('Button pressed', keyIndex, metadata)
		})

		// ...
	})
	.catch(console.log) // Handle error

// List and connect to all spaceMouse-devices:
listAllConnectedDevices().forEach((connectedDevice) => {
	setupSpaceMouse(connectedDevice)
		.then((spaceMouse) => {
			console.log(`Connected to ${spaceMouse.info.name}`)

			// Listen to pressed buttons:
			spaceMouse.on('down', (keyIndex) => {
				console.log('Button pressed ', keyIndex)
			})
			// Listen to released buttons:
			spaceMouse.on('up', (keyIndex) => {
				console.log('Button released', keyIndex)
			})
			// Listen to Rotation changes:
			// spaceMouse.on('rotate', (rotate) => {
			// 	console.log(`Rotate ${JSON.stringify(rotate)}`)
			// })
			// Listen to Translation changes:
			spaceMouse.on('translate', (translate) => {
				console.log(`Translate ${JSON.stringify(translate)}`)
			})
		})
		.catch(console.log) // Handle error
})
