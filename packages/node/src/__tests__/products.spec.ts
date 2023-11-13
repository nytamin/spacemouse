import { PRODUCTS } from '@spacemouse-lib/core'

describe('products.ts', () => {
	test('productIds should be unique', async () => {
		const productIds = new Map<string, string>()
		for (const product of Object.values(PRODUCTS)) {
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
})
