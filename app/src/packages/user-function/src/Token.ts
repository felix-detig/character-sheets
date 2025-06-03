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

export type TokenLocation = {
	position: number;
	line: number;
	column: number;
};

export type Token = {
	kind: 'token';
	type: TokenType;
	location: TokenLocation;
	value: string;
};