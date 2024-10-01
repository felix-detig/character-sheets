import GetterGraph from './GetterGraph';

/**
 * The Parameter passed to each getter function inserted into a {@link GetterGraph}.
 */
export default class GetterContext<K, V> {
	
	get: (key: K) => V | undefined;

	constructor(get: (key: K) => V | undefined) {
		this.get = get;
	}

	max(...args: number[]): number {
		return Math.max(...args);
	}

	min(...args: number[]): number {
		return Math.min(...args);
	}

	floor(n: number): number {
		return Math.floor(n);
	}

	ceil(n: number): number {
		return Math.ceil(n);
	}

	round(n: number): number {
		return Math.round(n);
	}

}