# SpaceMouse and SpaceNavigator connection library

[![Node CI](https://github.com/nytamin/spacemouse/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/nytamin/spacemouse/actions/workflows/lint-and-test.yml)

A Node.js module to interact with the [3Dconnexion devices](https://3dconnexion.com), such as the SpaceMouse and SpaceNavigator.

This repository is not affiliated with 3Dconnexion in any way.

License: MIT

## Demo

If you are using a [browser that supports WebHID](https://caniuse.com/webhid), you can try out the library right away, in the browser: [Demo](https://nytamin.github.io/spacemouse/).

## Supported devices

Some of the devices supported by this library are:

- SpaceNavigator
- SpaceMouse Wireless
- SpaceMouse Compact
- SpaceMouse Module
- SpaceMouse Pro
- SpaceMouse Pro Wireless
- SpacePilot PRO
- SpaceMouse Enterprise
- CadMouse
- CadMouse Wireless
- CadMouse Pro Wireless
- CadMouse Compact
- CadMouse Pro
- CadMouse Compact Wireless

See the full list in [products.ts](packages/core/src/products.ts).

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

Note: If you need more than 4 devices simultaneously, you might also have to set your env-var [UV_THREADPOOL_SIZE](http://docs.libuv.org/en/v1.x/threadpool.html):

```javascript
var { env } = require('process')
env.UV_THREADPOOL_SIZE = 8 // Allow up to 8 devices
```

## Getting started - Node.js

### Watch for connected SpaceMouse (recommended)

This is the recommended way to use this library, to automatically be connected or reconnected to the device.

_Note: The watcher uses the [node-usb](https://github.com/node-usb/node-usb) library, which might be unsupported on some platforms. If it is not supported, it can use polling as fallback._

```javascript
const { SpaceMouseWatcher } = require('spacemouse-node') // or spacemouse-webhid in browser

/*
	This example connects to any connected SpaceMouse devices and logs
	whenever the mouse is moved or a button is pressed.
*/

// Set up the watcher for SpaceMouse:
const watcher = new SpaceMouseWatcher({
	// usePolling: false // To be used if node-usb is not supported
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
	// Listen to Rotation changes:
	spaceMouse.on('rotate', (rotate) => {
		console.log(`Rotate ${JSON.stringify(rotate)}`)
	})
	// Listen to Translation changes:
	spaceMouse.on('translate', (translate) => {
		console.log(`Translate ${JSON.stringify(translate)}`)
	})
	// Listen to pressed buttons:
	spaceMouse.on('down', (keyIndex) => {
		console.log('Button pressed ', keyIndex)
	})
	// Listen to released buttons:
	spaceMouse.on('up', (keyIndex) => {
		console.log('Button released', keyIndex)
	})
})

// To stop watching, call
// watcher.stop().catch(console.error)
```

### Connect to a devices manually

```javascript
const { setupSpaceMouse } = require('spacemouse-node') // or spacemouse-webhid in browser

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
```

or

```javascript
const { listAllConnectedDevices, setupSpaceMouse } = require('spacemouse-node')

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
```

## Getting started - Browser (WebHID)

See the example implementation at [packages/webhid-demo](packages/webhid-demo).

### Demo

If you are using a Chromium v89+ based browser, you can try out the [webhid demo](https://nytamin.github.io/spacemouse/).

## API documentation

### SpaceMouseWatcher (Node.js only)

The SpaceMouseWatcher has a few different options that can be set upon initialization:

```javascript
const { SpaceMouseWatcher } = require('spacemouse-node')
const watcher = new SpaceMouseWatcher({
	// usePolling: false
	// pollingInterval: 1000
})
watcher.on('error', (e) => {
	console.log('Error in SpaceMouseWatcher', e)
})
watcher.on('connected', (spaceMouse) => {
	// SpaceMouse connected...
})
```

#### usePolling

When this is set, the SpaceMouseWatcher will not use the `node-usb` library for detecting connected devices,
but instead resort to polling at an interval (`pollingInterval`).
This is compatible with more systems and OS:es, but might result in higher system usage, slower detection of new devices.

### SpaceMouse Events

```javascript
// Example:
spaceMouse.on('rotate', (rotation) => {
	console.log(rotation)
})
```

| Event            | Description                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `"error"`        | Triggered on error.<br>Emitted with `(error)`.                                                                |
| `"disconnected"` | Triggered when device is disconnected.                                                                        |
| `"rotate"`       | Triggered when the mouse is rotated.<br>Emitted with `(rotation: {pitch: number, roll: number, yaw: number})` |
| `"translate"`    | Triggered when the mouse is moved.<br>Emitted with `(translation: {x: number, y: number, z: number})`         |
| `"down"`, `"up"` | Triggered when a button is pressed / released.<br>Emitted with `(buttonIndex: number)`                        |

#### Other functionality

See [the SpaceMouse-class](packages/core/src/SpaceMouse.ts) for more functionality.

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
# To set up the SpaceMouse-repo for linking:
cd your/spaceMouse/repo
yarn lerna exec yarn link # This runs "yarn link" in all of the mono-repo packages
yarn build

# Every time after you've made any changes to the SpaceMouse-repo you need to rebuild
cd your/spaceMouse/repo
yarn build

# Set up your local test repo to used the linked SpaceMouse libraries:
cd your/test/repo
yarn add spacemouse-node
yarn link spacemouse-node
yarn link @spacemouse-lib/core

# To unlink the spacemouse-lib from your local test repo:
cd your/test/repo
yarn unlink spacemouse-node
yarn unlink @spacemouse-lib/core
yarn --force # So that it reinstalls the ordinary dependencies
```

### Contribution guidelines

If you have any questions or want to report a bug, [please open an issue at Github](https://github.com/nytamin/spacemouse/issues/new).

If you want to contribute a bug fix or improvement, we'd happily accept Pull Requests.
(If you're planning something big, [please open an issue](https://github.com/nytamin/spacemouse/issues/new) to announce it first, and spark discussions.

#### Coding style and tests

Please follow the same coding style as the rest of the repository as you type. :)

Before committing your code to git, be sure to run these commands:

```bash
yarn # To ensure the right dependencies are installed and yarn.lock is updated
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
