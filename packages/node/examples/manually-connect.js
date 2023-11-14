const { setupSpaceMouse, listAllConnectedDevices } = require('spacemouse-node')

/*
	This example shows how to use setupSpaceMouse()
	directly, instead of going via SpaceMouseWatcher()
*/

// Connect to an SpaceMouse-device:
setupSpaceMouse()
	.then((spaceMouse) => {
		console.log(`Connected to ${spaceMouse.info.name}`)
		spaceMouse.on('disconnected', () => {
			console.log(`Disconnected!`)
			spaceMouse.removeAllListeners()
		})
		spaceMouse.on('error', (...args) => {
			console.log('SpaceMouse error:', ...args)
		})
		// Listen to Rotation changes:
		spaceMouse.on('rotate', (rotate) => {
			console.log(`Rotate ${JSON.stringify(rotate)}`)
		})
		// ...
	})
	.catch(console.log) // Handle error

// List and connect to all SpaceMouse-devices:
listAllConnectedDevices().forEach((connectedDevice) => {
	setupSpaceMouse(connectedDevice)
		.then((spaceMouse) => {
			console.log(`Connected to ${spaceMouse.info.name}`)
			spaceMouse.on('disconnected', () => {
				console.log(`Disconnected!`)
				spaceMouse.removeAllListeners()
			})
			spaceMouse.on('error', (...args) => {
				console.log('SpaceMouse error:', ...args)
			})

			// Listen to Rotation changes:
			spaceMouse.on('rotate', (rotate) => {
				console.log(`Rotate ${JSON.stringify(rotate)}`)
			})
			// ...
		})
		.catch(console.log) // Handle error
})
