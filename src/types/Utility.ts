/**
 * Like `A & B`, but shared properties between `A` and `B` are overwritten with `B`s types.
 */
export type Overwrite<A, B> = Omit<A, keyof B> & B;

/**
 * Like {@link Partial}, but it also affects nested objects.
 */
export type DeepPartial<T> = T extends object ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : T;