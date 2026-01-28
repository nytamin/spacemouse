import { expect, test } from 'vitest'
import { PRODUCTS, Product, VENDOR_IDS } from '../products.js'

test('All vendorIds is in VENDOR_IDS', () => {
	for (const product of Object.values<Product>(PRODUCTS)) {
		expect(product.name).toBeTruthy()
		expect(VENDOR_IDS.includes(product.vendorId)).toBeTruthy()
	}
})
