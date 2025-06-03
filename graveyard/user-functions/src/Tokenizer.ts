import * as Char from './Char';
import type { Token, TokenType } from './types';

const keywords = new Set(
	['not', 'and', 'or', 'if', 'else', 'for', 'start', 'end', 'step', 'true', 'false']
);

export default class Tokenizer {

	#source: Iterator<string>;
	#line = 0;
	#column = 0;
	#position = 0;
	#currentChar = '';
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
		while (!this.done) {
			switch (this.#currentChar) {
				case '+':
				case '-':
				case '*':
				case '.':
				case '(':
				case ')':
				case '{':
				case '}':
				case ',': {
					yield this.#tokenizeSingleChar();
					break;
				}

				case '/': {
					yield this.#tokenizeDivisionOperator();
					break;
				}

				case '<':
				case '>':
				case '=': {
					yield this.#tokenizeComparisonOperator();
					break;
				}

				case '#': {
					yield* this.#tokenizeReference();
					break;
				}

				default: {
					if (Char.isWhiteSpace(this.#currentChar)) {
						yield this.#tokenizeWhiteSpace();
					}
					else if (Char.isNumber(this.#currentChar)) {
						yield this.#tokenizeNumber();
					}
					else if (Char.isIdCharStart(this.#currentChar)) {
						yield this.#tokenizeKeyWord();
					}
					else {
						yield {
							type: 'invalid',
							location: this.getLocation(),
							value: this.#currentChar
						}
					}
				}
			}
		}

		yield {
			type: 'eof',
			location: this.getLocation(),
			value: ''
		};
	}

	#tokenizeNumber(): Token {
		const location = this.getLocation();
		const value = this.#collect(Char.isNumber);

		return {
			type: 'number',
			location,
			value
		};
	}

	#tokenizeKeyWord(): Token {
		const token = this.#tokenizeIdentifier();

		if (keywords.has(token.value)) {
			token.type = token.value as TokenType;
		}

		return token;
	}

	#tokenizeWhiteSpace(): Token {
		const location = this.getLocation();
		const value = this.#collect(Char.isWhiteSpace);

		return {
			type: 'whitespace',
			location,
			value
		};
	}

	*#tokenizeReference(): IterableIterator<Token> {
		yield {
			type: '#',
			location: this.getLocation(),
			value: '#'
		};

		this.#nextChar();
		let first = true;

		while (first || !this.#done && this.#currentChar === '.') {
			if (!first) {
				yield {
					type: '.',
					location: this.getLocation(),
					value: '.'
				};

				this.#nextChar();
			}
			
			first = false;

			yield this.#tokenizeIdentifier();
		}
	}

	#tokenizeIdentifier(): Token {
		const location = this.getLocation();
		const value = this.#collect(Char.isIdChar);

		return {
			type: Char.isIdCharStart(value[0]) ? 'identifier' : 'invalid',
			location,
			value
		};
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

		return {
			type: value as '<' | '>' | '<=' | '>=' | '=',
			location,
			value
		};
	}

	#tokenizeDivisionOperator(): Token {
		const location = this.getLocation();
		const nextChar = this.#nextChar();
		let value = '/';
		
		if (nextChar === '_' || nextChar === '^') {
			value += nextChar;
			this.#nextChar();
		}

		return {
			type: value as '/' | '/_' | '/^',
			location,
			value
		};
	}

	#tokenizeSingleChar(): Token {
		const location = this.getLocation();
		const value = this.#currentChar;

		this.#nextChar();

		return {
			type: value as TokenType,
			location,
			value
		};
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
		}
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