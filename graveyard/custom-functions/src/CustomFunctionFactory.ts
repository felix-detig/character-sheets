import WeakAnyMap from './store/WeakAnyMap';

const symbolWrapperValue = Symbol('CustomFunctionValue');
const symbolWrapperType = Symbol('CustomFunctionType');

class Wrapper {

	[symbolWrapperValue]: any;

	constructor(value: any) {
		this[symbolWrapperValue] = value;
	}

}

class ProxyConfig {

	factory: CustomFunctionFactory;

	constructor(factory: CustomFunctionFactory) {
		this.factory = factory;
	}

	apply(target: any, thisArg: any, args: any[]): any {
		return this.factory.wrap(Reflect.apply(target, thisArg, args));
	}

	construct(target: any, args: any[], newTarget: any): object {
		return this.factory.wrap(Reflect.construct(target, args, newTarget))!;
	}

	get(target: any, prop: string | symbol): any {
		if (prop === symbolWrapperValue) {
			return target[symbolWrapperValue];
		}
		else if (prop === symbolWrapperType) {
			return this.factory.typeof(target);
		}
		else {
			return this.factory.wrap(target[symbolWrapperValue][prop]);
		}
	}

	has(target: any, prop: string | symbol): boolean {
		return Reflect.has(target[symbolWrapperValue], prop);
	}

}

export default class CustomFunctionFactory {

	#globalOverrides: Record<string | symbol, any>;
	#proxyMap = new WeakAnyMap();
	#rootObject: object;
	#proxyConfig = new ProxyConfig(this);

	get globalOverrides() {
		return this.#globalOverrides;
	}

	get rootObject() {
		return this.#rootObject;
	}

	constructor(globalOverrides: Record<string | symbol, any>) {
		this.#globalOverrides = globalOverrides;
		this.#rootObject = this.#createRootObject(globalOverrides);

		this.#proxyMap.set(globalThis ?? window, this.#rootObject);
		this.#proxyMap.set(this.#rootObject, this.#rootObject);
	}

	create(...paramsAndBody: string[]): (...args: any[]) => any {
		const params = paramsAndBody.slice(0, -1);
		const body = paramsAndBody.at(-1);

		const customFunction = new Function(...params, `
			with (this) {
				let [${params.join(',')}] = arguments;
				${body}
			}
		`).bind(this.#rootObject);

		return (...args) => customFunction(...args.map(arg => this.wrap(arg)));
	}

	wrap(value: any): object | undefined {
		if (value == null) {
			return value;
		}

		let proxy = this.#proxyMap.get(value);

		if (proxy) {
			return proxy;
		}

		// default function constructor would allow escaping the controlled scope
		if (value === Function) {
			// TODO: return a custom contructor off this CustomFunctionFactory
			proxy = undefined;
		}
		else {
			proxy = new Proxy(new Wrapper(value), this.#proxyConfig);
		}

		this.#proxyMap.set(value, proxy);
		this.#proxyMap.set(proxy, proxy);

		return proxy;
	}

	unwrap(value: any) {
		if (value == null) {
			return value;
		}

		return value[symbolWrapperValue];
	}

	typeof(value: any) {
		if (value == null) {
			return typeof value;
		}

		return typeof value[symbolWrapperValue];
	}

	#createRootObject(overrides: Record<string | symbol, any>) {
		return new Proxy({}, {
			has: (_: any, prop: string | symbol) => {
				return prop in overrides || prop in window;
			},
	
			get: (_: any, prop: string | symbol): any => {
				const value = prop in overrides ? overrides[prop] : (window as any)[prop];

				return this.wrap(value);
			},
	
			set: (): boolean => {
				return false;
			}
		});
	}

}

// export function createCustomFunctionFactory(
// 	context: Record<string, any>
// ): (...paramsOrBody: string[]) => Function {
// 	const shadowProperties = Object.getOwnPropertyNames(window);
	
// 	const newGlobal = {
// 		...context,
// 		eval,
// 	};

// 	for (const prop of ['undefined', 'eval', ...allowProperties]) {
// 		const index = shadowProperties.indexOf(prop);

// 		if (index > -1) {
// 			shadowProperties.splice(index, 1);
// 		}
// 	}

// 	let shadows = '';

// 	for (const prop of shadowProperties) {
// 		const propFirstChar = prop.charCodeAt(0);
// 		const isUnderscore = propFirstChar === 95;
// 		const isDollarSign = propFirstChar === 36;
// 		const isLetterUpperCase = propFirstChar >= 65 && propFirstChar <= 90;
// 		const isLetterLowerCase = propFirstChar >= 97 && propFirstChar <= 122;
// 		const isValidVariableName =
// 			isUnderscore || isDollarSign || isLetterUpperCase || isLetterLowerCase;

// 		if (isValidVariableName) {
// 			shadows += `const ${prop} = undefined;`;
// 		}
// 	}

// 	const isolatedEvalFactory = new Function(`
// 		${shadows}

// 		return script => eval('var eval = undefined;' + script);
// 	`).bind(undefined);

// 	return isolatedEvalFactory();


// 	return () => () => {};
// }