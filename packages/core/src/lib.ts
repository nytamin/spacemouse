/*
 * This file contains internal convenience functions
 */

/** Convenience function to force the input to be of a certain type. */
export function literal<T>(o: T): T {
	return o
}

/** Get bit value in integer */
export function getBit(integer: number, bitPosition: number): 0 | 1 {
	return (integer & (1 << bitPosition)) === 0 ? 0 : 1
}
