/**
 * Creates an eval function that sets all global values to `undefined` for the scope of the passed script to be executed. 'eval' cannot be declared as a variable identifier inside the passed script, but it can be reassigned.
 * 
 * @param allowProperties - Global properties to allow (undefined is always allowed)
 * @returns 
 */
export function createIsolatedEval(allowProperties: string[] = []): (script: string) => any {
	let globalTarget;

	try {
		globalTarget = globalThis;
	}
	catch {
		globalTarget = window;
	}

	const shadowProperties = Object.getOwnPropertyNames(globalTarget);

	for (const prop of ['undefined', 'eval', ...allowProperties]) {
		const index = shadowProperties.indexOf(prop);

		if (index > -1) {
			shadowProperties.splice(index, 1);
		}
	}

	let shadows = '';

	for (const prop of shadowProperties) {
		const propFirstChar = prop.charCodeAt(0);
		const isUnderscore = propFirstChar === 95;
		const isDollarSign = propFirstChar === 36;
		const isLetterUpperCase = propFirstChar >= 65 && propFirstChar <= 90;
		const isLetterLowerCase = propFirstChar >= 97 && propFirstChar <= 122;
		const isValidVariableName =
			isUnderscore || isDollarSign || isLetterUpperCase || isLetterLowerCase;

		if (isValidVariableName) {
			shadows += `const ${prop} = undefined;`;
		}
	}

	const isolatedEvalFactory = new Function(`
		${shadows}

		return script => eval('var eval = undefined;' + script);
	`).bind(undefined);

	return isolatedEvalFactory();
}