import * as Char from './Char';
import type { Token, TokenType } from './Token';

const keywords: Set<string> = new Set<TokenType>(['not', 'and', 'or', 'if', 'else', 'true', 'false']);

export default class Tokenizer {

	#source: Iterator<string>;
	#position = 0;
	#line = 0;
	#column = 0;
	#currentChar: string;
	#done: boolean;

	get done() {
		return this.#done;
	}

	constructor(source: Iterable<string>) {
		this.#source = source[Symbol.iterator]() as Iterator<string>;
		
		const { value, done } = this.#source.next();

		this.#currentChar = value;
		this.#done = done ?? false;
	}

	*tokenize(): Iterable<Token> {
		let wordToken: Token | null = null;

		while (!this.done) {
			const splitToken = this.#tokenizeSplit();

			if (splitToken) {
				if (wordToken) {
					yield this.#finalizeWord(wordToken);
					wordToken = null;
				}

				yield splitToken;
			}
			else {
				wordToken = this.#buildWord(wordToken, this.#currentChar);
				this.#nextChar();
			}
		}
		
		if (wordToken) {
			yield this.#finalizeWord(wordToken);
			wordToken = null;
		}

		yield this.#token({
			type: 'eof',
			location: this.getLocation(),
			value: ''
		});
	}

	#buildWord(token: Token | null, char: string): Token {	
		if (!token) {
			const type = Char.isIdCharStart(char) ? (
				'identifier'
			) : Char.isNumber(char) ? (
				'number'
			) : (
				'invalid'
			);

			token = this.#token({
				type,
				value: char,
				location: this.getLocation(),
			});
		}
		else {
			if (
				(token.type === 'identifier' && !Char.isIdChar(char)) ||
				(token.type === 'number' && !Char.isNumber(char))
			) {
				token.type = 'invalid';
			}

			token.value += char;
		}

		return token;
	}

	#finalizeWord(token: Token) {
		if (token.type === 'identifier' && keywords.has(token.value)) {
			token.type = token.value as TokenType;
		}

		return token;
	}

	#tokenizeSplit(): Token | null {
		switch (this.#currentChar) {
			case '+':
			case '-':
			case '*':
			case '.':
			case '(':
			case ')':
			case '{':
			case '}':
			case ',':
			case '#': {
				return this.#tokenizeSingleChar();
			}

			case '/': {
				return this.#tokenizeDivisionOperator();
			}

			case '<':
			case '>':
			case '=': {
				return this.#tokenizeComparisonOperator();
			}
		}

		if (Char.isWhiteSpace(this.#currentChar)) {
			return this.#tokenizeWhiteSpace();
		}

		return null;
	}

	#tokenizeWhiteSpace(): Token {
		const location = this.getLocation();
		const value = this.#collect(Char.isWhiteSpace);

		return this.#token({
			type: 'whitespace',
			location,
			value
		});
	}

	#tokenizeComparisonOperator(): Token {
		const location = this.getLocation();
		const firstChar = this.#currentChar;
		const secondChar = this.#nextChar();
		let value: string;
		
		if (firstChar !== '=' && secondChar === '=') {
			value = firstChar + secondChar;
			this.#nextChar();
		}
		else {
			value = firstChar;
		}

		return this.#token({
			type: value as '<' | '>' | '<=' | '>=' | '=',
			location,
			value
		});
	}

	#tokenizeDivisionOperator(): Token {
		const location = this.getLocation();
		const nextChar = this.#nextChar();
		let value = '/';
		
		if (nextChar === '_' || nextChar === '^') {
			value += nextChar;
			this.#nextChar();
		}

		return this.#token({
			type: value as '/' | '/_' | '/^',
			location,
			value
		});
	}

	#tokenizeSingleChar(): Token {
		const location = this.getLocation();
		const value = this.#currentChar;

		this.#nextChar();

		return this.#token({
			type: value as TokenType,
			location,
			value
		});
	}

	#token(data: Omit<Token, 'kind'>): Token {
		const tokenNow = data as Token;

		tokenNow.kind = 'token';

		return tokenNow;
	}

	#collect(callback: (char: string) => boolean) {
		let value = '';

		while (!this.#done && callback(this.#currentChar)) {
			value += this.#currentChar;
			this.#nextChar();
		}

		return value;
	}

	getLocation() {
		return {
			position: this.#position,
			line: this.#line,
			column: this.#column,
		};
	}

	#nextChar(): string {
		if (this.#done) {
			throw new SyntaxError('Unexpected end of input!');
		}

		if (this.#currentChar === '\n') {
			this.#line += 1;
			this.#column = 0;
		}
		else {
			this.#column += 1;
		}

		this.#position += 1;

		const { value, done } = this.#source.next();

		this.#currentChar = value;
		this.#done = done ?? false;

		return this.#currentChar;
	}

}