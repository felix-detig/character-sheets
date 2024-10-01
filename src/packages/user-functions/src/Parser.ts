import * as Ast from './Ast';
import type { Token, TokenType } from './types';

export default class Parser {

	#tokens: Iterator<Token>;
	#currentToken: Token;
	#done: boolean;

	constructor(tokens: Iterable<Token>) {
		this.#tokens = tokens[Symbol.iterator]() as Iterator<Token>;

		const { value, done } = this.#tokens.next();

		this.#currentToken = value;
		this.#done = done ?? false;
	}

	parse(): Ast.Node {
		return this.#parseOperations();
	}

	#parseOperations(): Ast.Node {
		return this.#parseOperationsBoolean();
	}

	#parseOperationsBoolean(): Ast.Node {
		return this.#parseBinaryOperation(
			['and', 'or'],
			() => this.#parseOperationsNot()
		);
	}

	// TODO: add unary + and -
	#parseOperationsNot(): Ast.Node {
		const operator = this.#currentToken;

		if (this.#match('not')) {
			this.#ignore('whitespace');

			return new Ast.UnaryOperationNode(operator, this.#parseOperationsComparison());
		}
		else {
			return this.#parseOperationsComparison();
		}
	}

	#parseOperationsComparison(): Ast.Node {
		return this.#parseBinaryOperation(
			['<', '<=', '=', '>', '>='],
			() => this.#parseOperationsAddition()
		);
	}

	#parseOperationsAddition(): Ast.Node {
		return this.#parseBinaryOperation(
			['+', '-'],
			() => this.#parseOperationsMultiplication()
		);
	}

	#parseOperationsMultiplication(): Ast.Node {
		return this.#parseBinaryOperation(
			['*', '/', '/_', '/^'],
			() => this.#parseOperand()
		);
	}

	#parseBinaryOperation(operators: TokenType[], parseOperand: () => Ast.Node) {
		let left = parseOperand();

		this.#ignore('whitespace');

		while (operators.includes(this.#currentToken.type)) {
			const operator = this.#currentToken;

			this.#nextToken();
			this.#ignore('whitespace');

			const right = parseOperand();

			left = new Ast.BinaryOperationNode(left, operator, right);

			this.#ignore('whitespace');
		}

		return left;
	}

	#parseOperand(): Ast.Node {
		if (this.#match('(')) {
			const result = this.parse();

			this.#ignore('whitespace');
			this.#expect(')');

			return result;
		}
		else if (this.#currentToken.type === 'number') {
			return this.#parseNumber();
		}
		else if (this.#currentToken.type === '#') {
			return this.#parseReference();
		}
		else if (this.#currentToken.type === 'if') {
			return this.#parseIf();
		}
		else {
			throw new SyntaxError(`Unexpected token '${this.#currentToken.value}'!`);
		}
	}

	#parseNumber(): Ast.Node {
		let value = this.#expect('number').value;

		if (this.#match('.')) {
			value += '.' + this.#expect('number').value;
		}

		return new Ast.NumberNode(Number.parseFloat(value));
	}

	#parseReference(): Ast.Node {
		this.#expect('#');

		const path = [];

		do {
			path.push(this.#expect('identifier').value);
		}
		while (this.#match('.'));

		return new Ast.ReferenceNode(path);
	}

	#parseIf(): Ast.Node {
		this.#expect('if');
		this.#ignore('whitespace');
		this.#expect('{');
		this.#ignore('whitespace');

		const condition = this.parse();

		this.#ignore('whitespace');
		this.#expect('}');
		this.#ignore('whitespace');
		this.#expect('{');
		this.#ignore('whitespace');

		const trueBranch = this.parse();

		this.#ignore('whitespace');
		this.#expect('}');
		this.#ignore('whitespace');
		
		if (!this.#match('else')) {
			return new Ast.IfNode(condition, trueBranch, null);
		}
		
		this.#ignore('whitespace');
		
		if (this.#currentToken.type === 'if') {
			return new Ast.IfNode(condition, trueBranch, this.#parseIf());
		}

		this.#expect('{');
		this.#ignore('whitespace');

		const falseBranch = this.parse();

		this.#ignore('whitespace');
		this.#expect('}');

		return new Ast.IfNode(condition, trueBranch, falseBranch);
	}

	#match(tokenType: TokenType): boolean {
		if (this.#currentToken.type === tokenType) {
			this.#nextToken();
			return true;
		}

		return false;
	}

	#expect(tokenType: TokenType): Token {
		const token = this.#currentToken;

		if (token.type !== tokenType) {
			throw new SyntaxError(`Invalid token '${this.#currentToken.value}', expected '${tokenType}'!`);
		}

		this.#nextToken();

		return token;
	}

	#ignore(tokenType: TokenType) {
		if (this.#currentToken.type === tokenType) {
			this.#nextToken();
		}
	}

	#nextToken(): Token {
		if (this.#done) {
			throw new SyntaxError('Unexpected end of input!');
		}

		const { value, done } = this.#tokens.next();

		this.#currentToken = value;
		this.#done = done ?? false;

		return this.#currentToken;
	}

}