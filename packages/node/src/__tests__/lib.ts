/** Data sent to the panel */
let sentData: string[] = []

export function getSentData() {
	return sentData
}

export function resetSentData() {
	sentData = []
}

declare global {
	namespace jest {
		interface Matchers<R> {
			toBeObject(): R
			toBeWithinRange(a: number, b: number): R
		}
	}
}
expect.extend({
	toBeObject(received) {
		return {
			message: () => `expected ${received} to be an object`,
			pass: typeof received == 'object',
		}
	},
	toBeWithinRange(received, floor, ceiling) {
		if (typeof received !== 'number') {
			return {
				message: () => `expected ${received} to be a number`,
				pass: false,
			}
		}
		const pass = received >= floor && received <= ceiling
		if (pass) {
			return {
				message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
				pass: true,
			}
		} else {
			return {
				message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
				pass: false,
			}
		}
	},
})
