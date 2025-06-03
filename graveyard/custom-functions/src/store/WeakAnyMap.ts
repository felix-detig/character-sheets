import WeakPairMap from './WeakPairMap';
import WeakValueMap from './WeakValueMap';

/**
 * Similar to {@link Map}, but combines {@link WeakValueMap} and {@link WeakPairMap} to allow weak keys and non-weak keys. The values must be {@link WeakRef}'able.
 */
export default class WeakAnyMap {

	#mapWeakKey = new WeakPairMap();
	#mapStrongKey = new WeakValueMap();

	#isWeakKey(key: any): boolean {
		const type = typeof key;

		return (
			(type === 'object' && key !== null) ||
			type === 'function' ||
			(type === 'symbol' && Symbol.keyFor(key) === undefined)
		);
	}

	#resolveMap(key: any): WeakPairMap<any, any> | WeakValueMap<any, any> {
		return this.#isWeakKey(key) ? this.#mapWeakKey : this.#mapStrongKey;
	}

	set(key: any, value: any): WeakAnyMap {
		this.#resolveMap(key).set(key, value);

		return this;
	}

	get(key: any): any {
		return this.#resolveMap(key).get(key);
	}

	has(key: any): boolean {
		return this.#resolveMap(key).has(key);
	}

	delete(key: any): boolean {
		return this.#resolveMap(key).delete(key);
	}

}