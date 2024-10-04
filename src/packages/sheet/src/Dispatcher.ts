export type Listener<K, V> = (value: V, key: K) => void;

export default class Dispatcher<K, V> {

	#listenersByKey = new Map<K, Set<Listener<K, V>>>();

	on(key: K, listener: Listener<K, V>) {
		let listeners = this.#listenersByKey.get(key);

		if (!listeners) {
			listeners = new Set();
			this.#listenersByKey.set(key, listeners);
		}

		listeners.add(listener);
	}

	off(key: K, listener: Listener<K, V>): boolean {
		const listeners = this.#listenersByKey.get(key);

		if (!listeners) {
			return false;
		}

		const wasRemoved = listeners.delete(listener) ?? false;

		if (wasRemoved && listeners.size === 0) {
			this.#listenersByKey.delete(key);
		}

		return wasRemoved;
	}

	dispatch(key: K, value: V) {
		const listeners = this.#listenersByKey.get(key);

		if (!listeners) {
			return;
		}

		for (const listener of listeners) {
			listener(value, key);
		}
	}

}