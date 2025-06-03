import type GetterContext from './GetterContext';

export type Getter<K, V> = (context: GetterContext<K, V>) => V;

export type Stringifyable = { toString: () => string };