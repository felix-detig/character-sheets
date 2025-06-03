/**
 * Similar to{@link WeakMap}, but both keys and values are weakly referenced. If either key or value is garbage collected, the entry is removed from the map.
 */
export default class WeakPairMap<K extends WeakKey, V extends WeakKey> {

	#keyRefsByKey = new WeakMap();
	#map = new WeakMap<K, WeakRef<V>>();
	#registry = new FinalizationRegistry((keyRef: WeakRef<K>) => {
		this.#registry.unregister(keyRef);

		const key = keyRef.deref();

		if (key) {
			this.#keyRefsByKey.delete(key);
			this.#map.delete(key);
		}
	});

	set(key: K, value: V): WeakPairMap<K, V> {
		let keyRef = this.#keyRefsByKey.get(key);

		if (keyRef) {
			this.#registry.unregister(keyRef);
		}
		else {
			keyRef = new WeakRef(key);
			this.#keyRefsByKey.set(key, keyRef);
		}
		
		const valueRef = new WeakRef(value);
		
		this.#registry.register(value, keyRef, keyRef);
		this.#registry.register(key, keyRef, keyRef);
		this.#map.set(key, valueRef);

		return this;
	}

	get(key: K): V | undefined {
		return this.#map.get(key)?.deref();
	}

	has(key: K): boolean {
		return !!this.get(key);
	}

	delete(key: K): boolean {
		const keyRef = this.#keyRefsByKey.get(key);

		this.#registry.unregister(keyRef);
		this.#map.delete(key);
		this.#keyRefsByKey.delete(key);

		return !!keyRef?.deref();
	}

}