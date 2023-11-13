const { SpaceMouseWatcher } = require('spacemouse-node')


/*
	This example connects to any connected SpaceMouse devices and logs
	whenever a button is pressed or analog thing is moved
*/

// Set up the watcher for spaceMouse:
const watcher = new SpaceMouseWatcher({
	// usePolling: false
	// pollingInterval= 1000
})

watcher.on('error', (e) => {
	console.log('Error in SpaceMouseWatcher', e)
})
watcher.on('connected', (spaceMouse) => {
	console.log(`SpaceMouse device of type ${spaceMouse.info.name} connected`)

	spaceMouse.on('disconnected', () => {
		console.log(`SpaceMouse device of type ${spaceMouse.info.name} was disconnected`)
		// Clean up stuff
		spaceMouse.removeAllListeners()
	})
	spaceMouse.on('error', (...errs) => {
		console.log('SpaceMouse error:', ...errs)
	})

	// Listen to pressed buttons:
	spaceMouse.on('down', (keyIndex) => {
		console.log('Button pressed ', keyIndex)
	})
	// Listen to released buttons:
	spaceMouse.on('up', (keyIndex) => {
		console.log('Button released', keyIndex)
	})
	// Listen to Rotation changes:
	spaceMouse.on('rotate', (rotate) => {
		console.log(`Rotate ${JSON.stringify(rotate)}`)
	})
	// Listen to Translation changes:
	spaceMouse.on('translate', (translate) => {
		console.log(`Translate ${JSON.stringify(translate)}`)
	})
})

// To stop watching, call
// watcher.stop().catch(console.error)
