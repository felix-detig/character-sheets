export type TokenType =
	'+' | '-' | '*' | '/' | '/_' | '/^' |
	'<' | '>' | '<=' | '>=' | '=' |
	'#' | '.' |
	'(' | ')' | '{' | '}' | ',' |
	'not' | 'and' | 'or' |
	'if' | 'else' |
	'for' | 'start' | 'end' | 'step' |
	'identifier' | 'invalid' | 'number' | 'whitespace';

export type Token = {
	type: TokenType;
	location: {
		position: number;
		line: number;
		column: number;
	};
	value: string;
};