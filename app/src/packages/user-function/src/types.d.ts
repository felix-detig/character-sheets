export type UserFunctionContext = {
	get(keys: string[]): number | boolean | undefined;
	[k: string]: any;
};

export type UserFunctionValue = number | boolean;