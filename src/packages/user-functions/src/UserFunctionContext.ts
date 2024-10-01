export default class UserFunctionContext {

	#passedGet: (keys: string[]) => number | boolean | undefined;

	constructor(get: (keys: string[]) => number | boolean | undefined) {
		this.#passedGet = get;
	}

	get(keys: string[]): number | boolean | undefined {
		return this.#passedGet(keys);
	}

}