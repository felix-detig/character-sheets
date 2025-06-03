/**
 * Similar to {@link WeakMap}, but the values are weakly referenced instead of the keys.
 */
export default class WeakValueMap<K, V extends WeakKey> {

	#registry = new FinalizationRegistry((key: K) => this.#map.delete(key));
	#map = new Map<K, WeakRef<V>>();

	get size(): number {
		return this.#map.size;
	}

	*[Symbol.iterator](): IterableIterator<[K, V]> {
		for (const entry of this.#map) {
			const looseEntry: [K, WeakRef<V> | V | undefined] = entry;

			looseEntry[1] = entry[1].deref();

			if (looseEntry[1] !== undefined) {
				yield looseEntry as [K, V];
			}
		}
	}

	#unregister(weakRef: WeakRef<V> | undefined) {
		if (!weakRef) return;

		this.#registry.unregister(weakRef);
	}

	/**
	 * @throws {TypeError} If `value` is not a valid {@link WeakRef} target.
	 */
	set(key: K, value: V): WeakValueMap<K, V> {
		this.#unregister(this.#map.get(key));
		
		const weakRef = new WeakRef(value);
		
		this.#registry.register(value, key, weakRef);
		this.#map.set(key, weakRef);

		return this;
	}

	get(key: K): V | undefined {
		return this.#map.get(key)?.deref();
	}

	has(key: K): boolean {
		return !!this.get(key);
	}

	delete(key: K): boolean {
		const weakRef = this.#map.get(key);

		this.#unregister(weakRef);
		this.#map.delete(key);

		return !!weakRef?.deref();
	}

	forEach(callbackFn: (value: V, key: K, map: WeakValueMap<K, V>) => void, thisArg: any) {
		for (const [key, value] of this) {
			callbackFn.call(thisArg, value, key, this);
		}
	}

	*keys(): IterableIterator<K> {
		for (const [key] of this) {
			yield key;
		}
	}

	*values(): IterableIterator<V> {
		for (const [, value] of this) {
			yield value;
		}
	}

	entries(): IterableIterator<[K, V]> {
		return this[Symbol.iterator]();
	}

	clear() {
		for (const value of this.#map.values()) {
			this.#unregister(value);
		}

		this.#map.clear();
	}

}