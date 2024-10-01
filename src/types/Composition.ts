/**
 * Like `A & B`, but shared properties between `A` and `B` are overwritten with `B`s types.
 */
export type Overwrite<A, B> = Omit<A, keyof B> & B;