import * as Ast from './Ast';
import type { Token, TokenType } from './types';

export default class Parser {

	#tokens: Iterator<Token>;
	#currentToken: Token;
	#done: boolean;

	constructor(tokens: Iterable<Token>) {
		this.#tokens = tokens[Symbol.iterator]();

		const { value, done } = this.#tokens.next();

		this.#currentToken = value;
		this.#done = done ?? false;
	}

	parse(): Ast.Node {
		this.#ignore('whitespace');

		const value = this.#parseExpression();

		this.#ignore('whitespace');

		if (this.#currentToken.type !== 'eof') {
			throw new SyntaxError(`Unexpected token '${this.#currentToken.value}'!`);
		}

		return value;
	}

	#parseExpression(): Ast.Node {
		return this.#parseOperationsBoolean();
	}

	#parseOperationsBoolean(): Ast.Node {
		return this.#parseBinaryOperation(
			['and', 'or'],
			() => this.#parseOperationsNot()
		);
	}

	#parseOperationsNot(): Ast.Node {
		return this.#parseUnaryOperation(
			['not'],
			() => this.#parseOperationsComparison()
		);
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
			() => this.#parseOperationsSign()
		);
	}
	
	#parseOperationsSign(): Ast.Node {
		return this.#parseUnaryOperation(
			['+', '-'],
			() => this.#parseOperand()
		);
	}

	#parseBinaryOperation(operators: TokenType[], parseOperand: () => Ast.Node) {
		let left = parseOperand();

		this.#ignore('whitespace');

		while (!this.#done && operators.includes(this.#currentToken.type)) {
			const operator = this.#currentToken;

			this.#nextToken();
			this.#ignore('whitespace');

			const right = parseOperand();

			left = new Ast.BinaryOperationNode(left, operator, right);

			this.#ignore('whitespace');
		}

		return left;
	}

	
	#parseUnaryOperation(operators: TokenType[], parseOperand: () => Ast.Node): Ast.Node {
		if (!operators.includes(this.#currentToken.type)) {
			return parseOperand();
		}

		const operator = this.#currentToken;

		this.#nextToken();
		this.#ignore('whitespace');

		return new Ast.UnaryOperationNode(operator, parseOperand());
	}

	#parseOperand(): Ast.Node {
		if (this.#match('(')) {
			const result = this.#parseExpression();

			this.#ignore('whitespace');
			this.#expect(')');

			return result;
		}
		else if (this.#currentToken.type === 'number') {
			return this.#parseNumber();
		}
		else if (this.#currentToken.type === 'true' || this.#currentToken.type === 'false') {
			return this.#parseBoolean();
		}
		else if (this.#currentToken.type === '#') {
			return this.#parseReference();
		}
		else if (this.#currentToken.type === 'if') {
			return this.#parseIf();
		}
		else if (this.#currentToken.type === 'eof') {
			throw new SyntaxError('Unexpected end of input!');
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

	#parseBoolean(): Ast.Node {
		if (this.#match('true')) {
			return new Ast.BooleanNode(true);
		}
		else if (this.#match('false')) {
			return new Ast.BooleanNode(false);
		}
		else {
			throw new Error(`Invalid boolean token '${this.#currentToken.value}'!`);
		}
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

		const condition = this.#parseExpression();

		this.#ignore('whitespace');
		this.#expect('}');
		this.#ignore('whitespace');
		this.#expect('{');
		this.#ignore('whitespace');

		const trueBranch = this.#parseExpression();

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

		const falseBranch = this.#parseExpression();

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