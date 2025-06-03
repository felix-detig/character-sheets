import GetterGraph from './GetterGraph';

/**
 * The Parameter passed to each getter function inserted into a {@link GetterGraph}.
 */
export default class GetterContext<K, V> {
	
	get: (key: K[]) => V | undefined;

	constructor(get: (key: K[]) => V | undefined) {
		this.get = get;
	}

}