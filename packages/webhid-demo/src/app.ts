import { getOpenedSpaceMice, requestSpaceMice, setupSpaceMouse, SpaceMouse } from 'spacemouse-webhid'

function appendLog(str: string) {
	const logElm = document.getElementById('log')
	if (logElm) {
		logElm.textContent = `${str}\n${logElm.textContent}`
	}
}

let currentSpaceMouse: SpaceMouse | null = null

async function openDevice(device: HIDDevice): Promise<void> {
	const spaceMouse = await setupSpaceMouse(device)

	currentSpaceMouse = spaceMouse

	appendLog(`Connected to "${spaceMouse.info.name}"`)

	spaceMouse.on('down', (keyIndex: number) => {
		appendLog(`Button ${keyIndex} down`)
	})
	spaceMouse.on('up', (keyIndex: number) => {
		appendLog(`Button ${keyIndex} up`)
	})
	spaceMouse.on('rotate', (rotate) => {
		appendLog(`Rotate    ${JSON.stringify(rotate)}`)
	})
	spaceMouse.on('translate', (translate) => {
		appendLog(`Translate ${JSON.stringify(translate)}`)
	})
}

window.addEventListener('load', () => {
	appendLog('Page loaded')
	// Attempt to open a previously selected device:
	getOpenedSpaceMice()
		.then((devices) => {
			if (devices.length > 0) {
				appendLog(`"${devices[0].productName}" already granted in a previous session`)
				console.log(devices[0])
				openDevice(devices[0]).catch(console.error)
			}
		})
		.catch(console.error)
})

const consentButton = document.getElementById('consent-button')
consentButton?.addEventListener('click', () => {
	if (currentSpaceMouse) {
		appendLog('Closing device')
		currentSpaceMouse
			.close()
			.then(() => appendLog('Closed'))
			.catch(console.error)
		currentSpaceMouse = null
	}
	// Prompt for a device

	appendLog('Asking user for permissions...')
	requestSpaceMice()
		.then((devices) => {
			if (devices.length === 0) {
				appendLog('No device was selected')
				return
			}
			appendLog(`Access granted to "${devices[0].productName}"`)
			openDevice(devices[0]).catch(console.error)
		})
		.catch((error) => {
			appendLog(`No device access granted: ${error}`)
		})
})

const closeButton = document.getElementById('close-button')
closeButton?.addEventListener('click', () => {
	if (currentSpaceMouse) {
		appendLog('Closing device')
		currentSpaceMouse
			.close()
			.then(() => appendLog('Closed'))
			.catch(console.error)
		currentSpaceMouse = null
	}
})
