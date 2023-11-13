# Spacemouse

[![Node CI](https://github.com/nytamin/spacemouse/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/nytamin/spacemouse/actions/workflows/lint-and-test.yml)

A Node.js module to interact with the [3DConnection space mice](https://3dconnexion.com).

Licence: MIT

## Demo

If you are using a [browser that supports WebHID](https://caniuse.com/webhid), you can try out the library right away, in the browser: [Demo](https://nytamin.github.io/spacemouse/).

## Installation

### To use in Node.js

```bash
$ npm install --save spacemouse-node
or
$ yarn add spacemouse-node
```

### To use in browser

```bash
$ npm install --save spacemouse-webhid
or
$ yarn add spacemouse-webhid
```

### Linux

On linux, the `udev` subsystem blocks access for non-root users to the SpaceMouse without some special configuration. Save the following to `/etc/udev/rules.d/50-spacemouse.rules` and reload the rules with `sudo udevadm control --reload-rules`

```bash
SUBSYSTEM=="input", GROUP="input", MODE="0666"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0x46d", MODE:="666", GROUP="plugdev"
KERNEL=="hidraw*", ATTRS{idVendor}=="0x46d", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0x256f", MODE:="666", GROUP="plugdev"
KERNEL=="hidraw*", ATTRS{idVendor}=="0x256f", MODE="0666", GROUP="plugdev"
```

Note: If you need more than 4 space mice simultaneously, you might also have to set your env-var [UV_THREADPOOL_SIZE](http://docs.libuv.org/en/v1.x/threadpool.html):

```javascript
var { env } = require('process')
env.UV_THREADPOOL_SIZE = 8 // Allow up to 8 devices
```

## BREAKING CHANGES

Please note that version `2.0.0` is a _BREAKING CHANGE_, as most of the API have changed.
If you're upgrading from `<2.0.0`, please read the [_Migrations_](#Migrations) section below.

## Getting started - Node.js

### Watch for connected SpaceMouse (recommended)

This is the recommended way to use this library, to automatically be connected or reconnected to the device.

_Note: The watcher depends on the [node-usb](https://github.com/node-usb/node-usb) library, which might be unsupported on some platforms._

```javascript
const { SpaceMouseWatcher } = require('spacemouse-node')

/*
	This example connects to any conncted SpaceMouse devices and logs
	whenever a button is pressed or analog thing is moved
*/

// Set up the watcher:
const watcher = new SpaceMouseWatcher({
	// automaticUnitIdMode: false
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
	spaceMouse.on('down', (keyIndex, metadata) => {
		console.log('Button pressed ', keyIndex, metadata)

		// Light up a button when pressed:
		spaceMouse.setBacklight(keyIndex, 'red')
	})
	// Listen to released buttons:
	spaceMouse.on('up', (keyIndex, metadata) => {
		console.log('Button released', keyIndex, metadata)

		// Turn off button light when released:
		spaceMouse.setBacklight(keyIndex, false)
	})

	// Listen to jog wheel changes:
	spaceMouse.on('jog', (index, deltaPos, metadata) => {
		console.log(`Jog ${index} position has changed`, deltaPos, metadata)
	})
	// Listen to shuttle changes:
	spaceMouse.on('shuttle', (index, shuttlePos, metadata) => {
		console.log(`Shuttle ${index} position has changed`, shuttlePos, metadata)
	})
	// Listen to joystick changes:

	spaceMouse.on('joystick', (index, position, metadata) => {
		console.log(`Joystick ${index} position has changed`, position, metadata) // {x, y, z}
	})
	// Listen to t-bar changes:
	spaceMouse.on('tbar', (index, position, metadata) => {
		console.log(`T-bar ${index} position has changed`, position, metadata)
	})
})

// To stop watching, call
// watcher.stop().catch(console.error)
```

### Connect to a devices manually

```javascript
const { setupSpaceMouse } = require('spaceMouse')

/*
	This example shows how to use SpaceMouse.setupSpaceMouse()
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
```

or

```javascript
const { listAllConnectedDevices, setupSpaceMouse } = require('spaceMouse')

// List and connect to all spaceMouse-devices:
listAllConnectedDevices().forEach((connectedDevice) => {
	setupSpaceMouse(connectedDevice)
		.then((spaceMouse) => {
			console.log(`Connected to ${spaceMouse.info.name}`)

			// ...
		})
		.catch(console.log) // Handle error
```

## Getting started - Browser (WebHID)

See the example implementation at [packages/webhid-demo](packages/webhid-demo).

### Demo

If you are using a Chromium v89+ based browser, you can try out the [webhid demo](https://nytamin.github.io/spacemouse/).

## API documentation

### SpaceMouseWatcher (Node.js only)

The SpaceMouseWatcher has a few different options that can be set upon initialization:

```javascript
const { SpaceMouseWatcher } = require('spaceMouse')
const watcher = new SpaceMouseWatcher({
	// automaticUnitIdMode: false
	// usePolling: false
	// pollingInterval= 1000
})
watcher.on('error', (e) => {
	console.log('Error in SpaceMouseWatcher', e)
})
watcher.on('connected', (spaceMouse) => {
	// spaceMouse connected...
})
```

#### automaticUnitIdMode

When this is set to `true`, the SpaceMouseWatcher will enable the `"reconnected"` event for the spaceMice.

By default, there is no unique identifier stored on the SpaceMouse device that can be used to differ between
"reconnecting a previously known device" or "connecting a new device".
The `automaticUnitIdMode` fixes this by writing a pseudo-unique id to the `unitId` of the device,
if none has been set previously.

#### usePolling

When this is set, the SpaceMouseWatcher will not use the `usb` library for detecting connected devices,
but instead resort to polling at an interval (`pollingInterval`).
This is compatible with more systems and OS:es, but might result in slower detection of new devices.

### spaceMouse Events

```javascript
// Example:
spaceMouse.on('down', (keyIndex, metadata) => {
	console.log('Button pressed', keyIndex, metadata)
})
```

| Event            | Description                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `"error"`        | Triggered on error. Emitted with `(error)`.                                                                      |
| `"down"`, `"up"` | Triggered when a button is pressed/released. Emitted with `(keyIndex, metadata)`.                                |
| `"jog"`          | Triggered when the jog wheel is moved. Emitted with `(index, jogValue, metadata)`                                |
| `"shuttle"`      | Triggered when the shuttle is moved. Emitted with `(index, shuttleValue, metadata)`                              |
| `"joystick"`     | Triggered when the joystick is moved. Emitted with `(index, {x, y, z, deltaZ})`                                  |
| `"tbar"`         | Triggered when the T-bar is moved. Emitted with `(index, tbarPosition, metadata)`                                |
| `"disconnected"` | Triggered when device is disconnected.                                                                           |
| `"reconnected"`  | Triggered when device is reconnection. Only emitted when [automaticUnitIdMode](#automaticUnitIdMode) is enabled. |

### spaceMouse Methods

**Setting the backlight of a button**

```javascript
spaceMouse.setBacklight(keyIndex, color)

// Examples:
// Set blue light
spaceMouse.setBacklight(keyIndex, '0000ff')
// Set any available default light
spaceMouse.setBacklight(keyIndex, true)
// Turn off light
spaceMouse.setBacklight(keyIndex, false)
// Set flashing light
spaceMouse.setBacklight(keyIndex, 'red', true)

// Set color (for RGB-supported devices)
spaceMouse.setBacklight(keyIndex, 'ff3300')
```

**Set the indicator LEDs (the red/green status LED's)**

```javascript
spaceMouse.setIndicatorLED(ledIndex, on, flashing)

// Examples:
// Light up the green LED
spaceMouse.setIndicatorLED(1, true)
// Flash the red LED
spaceMouse.setIndicatorLED(2, true, true)
```

**Set backlight intensity**

```javascript
spaceMouse.setBacklightIntensity(intensity)

// Example:
// Set max intensity
spaceMouse.setBacklightIntensity(255)
```

**Set all backlights on or off**

```javascript
spaceMouse.setAllBacklights(color)

// Example:
// Light up all buttons
spaceMouse.setAllBacklights(true)
// Light up all buttons in a nice color
spaceMouse.setAllBacklights('ff33ff')
// Turn of all buttons
spaceMouse.setAllBacklights(false)
```

**Set flashing frequency**

```javascript
// The frequency can be set to 1-255, where 1 is fastest and 255 is the slowest.
// 255 is approximately 4 seconds between flashes.
spaceMouse.setFrequency(frequency)

// Example:
// Set the frequency to a pretty fast flash
spaceMouse.setFrequency(8)
```

** Set unit ID **

```javascript
// Sets the UID (unit Id) value in the SpaceMouse hardware
// Note: This writes to the EEPROM, don't call this function too often, or you'll kill the EEPROM! (An EEPROM only support a few thousands of write operations.)
spaceMouse.setUnitId(unitId)
```

** Save backlights **

```javascript
// Save the backlights (so they are restored to this after a power cycle).
// Note: This writes to the EEPROM, don't call this function too often, or you'll kill the EEPROM! (An EEPROM only support a few thousands of write operations.)
spaceMouse.saveBackLights()
```

#### Other functionality

See [the SpaceMouse-class](packages/core/src/spaceMouse.ts) for more functionality.

### Supported devices

Thanks to official support from [P.I Enginneering, the SpaceMouse manufacturer](https://spaceMouse.com/), there is support for all official (and some experimental) devices.

See the full list in [products.ts](packages/core/src/products.ts).

## Migrations

### 2.0.0

Version `2.0.0` is a breaking changes, which requires several changes in how to use the library.

The most notable changes are:

| Before, `<2.0.0`                                          | Changes in `>=2.0.0`                                                                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `let mySpaceMouse = new SpaceMouse()`                     | `let mySpaceMouse = await SpaceMouse.setupSpaceMouse()`                                                                                                                       |
| `mySpaceMouse.on('down', (keyIndex) => {} )`              | The numbering of `keyIndexes` has changed:<br/>_ The PS-button is on index 0.<br/>_ Other buttons start on index 1.<br/>\* Numbering of buttons have changed for some models. |
| `mySpaceMouse.on('downKey', (keyIndex) => {} )`           | Use `.on('down')` instead                                                                                                                                                     |
| `mySpaceMouse.on('upKey', (keyIndex) => {} )`             | Use `.on('up')` instead                                                                                                                                                       |
| `mySpaceMouse.on('downAlt', (keyIndex) => {} )`           | Use `.on('down')` instead (PS-button is on index 0)                                                                                                                           |
| `mySpaceMouse.on('upAlt', (keyIndex) => {} )`             | Use `.on('up')` instead (PS-button is on index 0)                                                                                                                             |
| `mySpaceMouse.on('jog', (position) => {} )`               | `mySpaceMouse.on('jog', (index, position) => {} )`                                                                                                                            |
| `mySpaceMouse.on('shuttle', (position) => {} )`           | `mySpaceMouse.on('shuttle', (index, position) => {} )`                                                                                                                        |
| `mySpaceMouse.on('tbar', (position, rawPosition) => {} )` | `mySpaceMouse.on('tbar', (index, position) => {} )`                                                                                                                           |
| `mySpaceMouse.on('joystick', (position) => {} )`          | `mySpaceMouse.on('joystick', (index, position) => {} )`                                                                                                                       |
| `mySpaceMouse.setBacklight(...)`                          | Arguments have changed, see docs                                                                                                                                              |
| `mySpaceMouse.setAllBacklights(...)`                      | Arguments have changed, see docs                                                                                                                                              |
| `mySpaceMouse.setLED(index, ...)`                         | `mySpaceMouse.setIndicatorLED(index, ...)` (index 1 = the red, 2 = the green one)                                                                                             |

### 2.1.1

Version `2.1.1` has a minor change for when stopping the SpaceMouseWatcher instance:

```javascript
const watcher = new SpaceMouseWatcher()
await watcher.stop() // Now returns a promise
```

# For developers

This is a mono-repo, using [Lerna](https://github.com/lerna/lerna) and [Yarn](https://yarnpkg.com).

### Setting up your local environment

This repo is using [Yarn](https://yarnpkg.com). If you don't want to use it, replace `yarn xyz` with `npm run xyz` below.

To install Yarn, just run `npm install -g yarn`.

### Setting up the repo

- Clone the repo and `cd` into it.
- Install all dependencies: `yarn`.
- Do an initial build: `yarn build`

### Running and testing local changes

If you'd like to run and test your local changes, `yarn link` is a useful tool to symlink your local `spaceMouse` dependency into your test repo.

```bash
# To set up the spaceMouse-repo for linking:
cd your/spaceMouse/repo
yarn lerna exec yarn link # This runs "yarn link" in all of the mono-repo packages
yarn build

# Every time after you've made any changes to the spaceMouse-repo you need to rebuild
cd your/spaceMouse/repo
yarn build

# Set up your local test repo to used the linked spaceMouse libraries:
cd your/test/repo
yarn add spaceMouse
yarn link spaceMouse
yarn link @spacemouse-lib/core

# To unlink the spacemouse-lib from your local test repo:
cd your/test/repo
yarn unlink spaceMouse
yarn unlink @spacemouse-lib/core
yarn --force # So that it reinstalls the ordinary dependencies
```

### Contribution guidelines

If you have any questions or want to report a bug, [please open an issue at Github](https://github.com/nytamin/spacemouse/issues/new).

If you want to contribute a bug fix or improvement, we'd happily accept Pull Requests.
(If you're planning something big, [please open an issue](https://github.com/nytamin/spacemouse/issues/new) to announce it first, and spark discussions.

### Coding style and tests

Please follow the same coding style as the rest of the repository as you type. :)

Before committing your code to git, be sure to run these commands:

```bash
yarn # To ensure the right dependencies are installed
yarn build # To ensure that there are no syntax or build errors
yarn lint # To ensure that the formatting follows the right rules
yarn test # To ensure that your code passes the unit tests.
```

If you're adding a new functionality, adding unit tests for it is much appreciated.

### Notes to maintainers

#### Making a nightly build

- Push your changes to any branch
- Trigger a run of [CI: publish-nightly](https://github.com/nytamin/spacemouse/actions/workflows/publish-nightly.yml)

#### Making a Pre-release

- Update the branch (preferably the master branch)
- `yarn release:bump-prerelease` and push the changes (including the tag)
- Trigger a run of [CI: publish-prerelease](https://github.com/nytamin/spacemouse/actions/workflows/publish-prerelease.yml)

#### Making a Release

- Update the the master branch
- `yarn release:bump-release` and push the changes (including the tag)
- Trigger a run of [CI: publish-release](https://github.com/nytamin/spacemouse/actions/workflows/publish-release.yml) to publish to NPM.
- Trigger a run of [CI: publish-demo](https://github.com/nytamin/spacemouse/actions/workflows/publish-demo.yml) to update the docs.

### License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
