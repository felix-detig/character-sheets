export type TokenType =
	TokenTypeBinaryOperator |
	'#' | '.' |
	'(' | ')' | '{' | '}' | ',' |
	'not' | 
	'true' | 'false' |
	'if' | 'else' |
	// 'for' | 'start' | 'end' | 'step' |
	'identifier' | 'invalid' | 'number' | 'whitespace' |
	'eof';

export type TokenTypeBinaryOperator =
	'+' | '-' | '*' | '/' | '/_' | '/^' |
	'<' | '>' | '<=' | '>=' | '=' |
	'and' | 'or';

export type Token = {
	type: TokenType;
	location: {
		position: number;
		line: number;
		column: number;
	};
	value: string;
};

export type UserFunctionContext = {
	get(keys: string[]): number | boolean | undefined;
	[k: string]: any;
};