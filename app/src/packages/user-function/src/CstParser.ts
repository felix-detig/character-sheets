import type * as Cst from './Cst';
import type { Token, TokenType } from './Token';

const EXPECTED_ERROR = {};

export default class CstParser {

	#tokens: Iterator<Token, Token, Token>;
	#readTokens: Token[] = [];
	#readTokenIndex: number = 0;
	#ruleStack: Cst.Node[] = [];
	#eofToken: Token | null = null;

	constructor(tokens: Iterable<Token>) {
		this.#tokens = tokens[Symbol.iterator]();
	}

	done(): boolean {
		return this.#readTokenIndex === 0 && !!this.#eofToken;
	}

	parse(): Cst.Node {
		return this.#parseExpressions('eof');
	}

	#parseExpressions(endTokenType: TokenType): Cst.Node {
		return this.#rule('expressions', () => {
			this.#consumeWhitespace();

			while (!this.done() && !this.#matches(endTokenType)) {
				const prevToken = this.#peek();

				try {
					this.#addChild(this.#parseExpression());
					this.#consumeWhitespace();
				}
				catch {
					// handled by following infinite loop safeguard
				}

				if (prevToken === this.#peek()) {
					this.#addChild(this.#rule('invalid', () => {
						this.#advance();
						this.#consume();
					}));
				}
			}
		});
	}

	#parseExpression(): Cst.Node {
		return this.#parseOperations();
	}

	#parseOperations(): Cst.Node {
		return this.#parseOperationsBoolean();
	}

	#parseOperationsBoolean(): Cst.Node {
		return this.#parseBinaryOperation(
			['and', 'or'],
			() => this.#parseOperationsNot()
		);
	}

	#parseOperationsNot(): Cst.Node {
		return this.#parseUnaryOperation(
			['not'],
			() => this.#parseOperationsComparison()
		);
	}

	#parseOperationsComparison(): Cst.Node {
		return this.#parseBinaryOperation(
			['<', '<=', '=', '>', '>='],
			() => this.#parseOperationsAddition()
		);
	}

	#parseOperationsAddition(): Cst.Node {
		return this.#parseBinaryOperation(
			['+', '-'],
			() => this.#parseOperationsMultiplication()
		);
	}

	#parseOperationsMultiplication(): Cst.Node {
		return this.#parseBinaryOperation(
			['*', '/', '/_', '/^'],
			() => this.#parseOperationsSign()
		);
	}
	
	#parseOperationsSign(): Cst.Node {
		return this.#parseUnaryOperation(
			['+', '-'],
			() => this.#parseOperand()
		);
	}

	#parseBinaryOperation(operators: TokenType[], parseOperand: () => Cst.Node): Cst.Node {
		let left = parseOperand();

		this.#skipWhitespace();

		while (operators.includes(this.#peek().type)) {
			left = this.#rule('binaryOperation', () => {
				this.#addChild(left);
				this.#advance();
				this.#skipWhitespace();
				this.#consume();
				this.#addChild(parseOperand());
				this.#skipWhitespace();
			});
		}

		return left;
	}

	#parseUnaryOperation(operators: TokenType[], parseOperand: () => Cst.Node): Cst.Node {
		if (!operators.includes(this.#peek().type)) {
			return parseOperand();
		}

		return this.#rule('unaryOperation', () => {
			this.#advance();
			this.#skipWhitespace();
			this.#addChild(this.#parseUnaryOperation(operators, parseOperand));
		});
	}

	#parseOperand(): Cst.Node {
		if (this.#matches('(')) {
			return this.#rule('parenthesized', () => {
				this.#require('(');
				this.#addChild(this.#parseExpressions(')'));
				this.#require(')');
			});
		}
		else if (this.#matches('number')) {
			return this.#parseNumber();
		}
		else if (this.#matches('true') || this.#matches('false')) {
			return this.#parseBoolean();
		}
		else if (this.#matches('#')) {
			return this.#parseReference();
		}
		else if (this.#matches('if')) {
			return this.#parseIf();
		}
		else if (this.#matches('identifier') || this.#matches('invalid')) {
			return this.#rule('invalid', () => {
				this.#advance();
				this.#consume();
			});
		}
		else {
			throw EXPECTED_ERROR;
		}
	}

	#parseNumber(): Cst.Node {
		return this.#rule('number', () => {
			this.#require('number');
			
			if (this.#expect('.')) {
				if (!this.#expect('number')) {
					this.#require('invalid');
					this.#status('error');
				}
			}
		});
	}

	#parseBoolean(): Cst.Node {
		return this.#rule('boolean', () => {
			if (!this.#expect('true')) {
				this.#require('false');
			}
		});
	}

	#parseReference(): Cst.Node {
		return this.#rule('reference', () => {
			this.#require('#');
	
			do {
				if (!this.#expect('identifier')) {
					this.#require('invalid');
					this.#status('error');
				}
			}
			while (this.#expect('.'));
		});
	}

	#parseIf(): Cst.Node {
		return this.#rule('if', () => {
			this.#require('if');
			this.#consumeWhitespace();
			this.#require('{');
			this.#addChild(this.#parseExpressions('}'));
			this.#require('}');
			this.#consumeWhitespace();
			this.#require('{');
			this.#addChild(this.#parseExpressions('}'));
			this.#require('}');
			this.#consumeWhitespace();

			if (!this.#expect('else')) {
				return;
			}

			this.#consumeWhitespace();
			this.#addChild(this.#parseIf());
		});
	}
	
	#consumeWhitespace() {
		this.#skipWhitespace();
		this.#consume();
	}

	#skipWhitespace() {
		while (this.#matches('whitespace')) {
			this.#advance();
		}
	}

	#require(tokenType: TokenType) {
		if (this.#matches(tokenType)) {
			this.#advance();
			this.#consume();
		}
		else {
			throw EXPECTED_ERROR;
		}
	}

	#expect(tokenType: TokenType): boolean {
		if (this.#matches(tokenType)) {
			this.#advance();
			this.#consume();

			return true;
		}
		else {
			return false;
		}
	}

	#consume() {
		this.#peek();

		const consumed = this.#readTokens.splice(0, this.#readTokenIndex);
		
		if (consumed.length) {
			const rule = this.#ruleStack.at(-1)!;

			rule.children.push(...consumed);
		}

		this.#readTokenIndex = 0;
	}

	#addChild(child: Cst.Node | Token) {
		this.#ruleStack.at(-1)!.children.push(child);
	}

	#status(status: Cst.NodeStatus) {
		const node = this.#node();

		if (node) {
			node.status = status;
		}
	}

	#node(): Cst.Node | null {
		return this.#ruleStack.at(-1) ?? null;
	}

	#rule(nodeType: Cst.NodeType, factory: () => void): Cst.Node {
		const rule: Cst.Node = { kind: 'cst', type: nodeType, children: [], status: 'ok' };

		this.#ruleStack.push(rule);

		try {
			factory();
		}
		catch(error) {
			if (error !== EXPECTED_ERROR) {
				throw error;
			}

			this.#resetReadTokens();

			rule.status = 'error';
		}

		this.#ruleStack.pop();

		return rule;
	}

	#matches(tokenType: TokenType): boolean {
		return this.#peek().type === tokenType;
	}

	#resetReadTokens() {
		this.#readTokenIndex = 0;
	}

	#advance(offset = 1) {
		this.#readTokenIndex += offset;
	}

	#peek(offset = 0): Token {
		const targetIndex = this.#readTokenIndex + offset;

		while (!this.#eofToken && this.#readTokens.length <= targetIndex) {
			const { value, done } = this.#tokens.next();

			if (done) {
				throw new Error('Reached input end before EOF token!');
			}

			if (value.type === 'eof') {
				this.#eofToken = value;
			}
			else {
				this.#readTokens.push(value);
			}
		}

		return this.#readTokens[targetIndex] ?? this.#eofToken;
	}

}