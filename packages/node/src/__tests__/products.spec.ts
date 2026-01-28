import { expect, test } from 'vitest'

import { Product, PRODUCTS } from '@spacemouse-lib/core'

test('productIds should be unique', async () => {
	const productIds = new Map<string, string>()
	for (const product of Object.values<Product>(PRODUCTS)) {
		const productId: number = product.productId

		const idPair = `${productId}`
		try {
			expect(productIds.has(idPair)).toBeFalsy()
		} catch (err) {
			console.log('productId', idPair, productIds.get(idPair))
			throw err
		}
		productIds.set(idPair, product.name)
	}
})
