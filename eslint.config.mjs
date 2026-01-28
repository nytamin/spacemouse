// @ts-check

import { generateEslintConfig } from '@sofie-automation/code-standard-preset/eslint/main.mjs'

export default generateEslintConfig({
	ignores: ['vitest.config.ts'],
	testRunner: 'vitest',
})
