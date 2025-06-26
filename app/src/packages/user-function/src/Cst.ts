import type { Token, TokenType } from './Token';

export type NodeType =
	| 'binaryOperation'
	| 'boolean'
	| 'expressions'
	| 'if'
	| 'invalid'
	| 'number'
	| 'parenthesized'
	| 'reference'
	| 'unaryOperation';

export type NodeStatus = 'ok' | 'error';

export type Node = {
	kind: 'cst',
	type: NodeType,
	children: (Node | Token)[],
	status: NodeStatus;
};

export function toString(node: Node | Token): string {
	if (node.kind === 'token') {
		return node.value;
	}

	let output = '';

	for (const child of node.children) {
		output += toString(child);
	}

	return output;
}

const EXPECTED_ERROR = {};

export class Parser {

	#tokens: Iterator<Token, Token, Token>;
	#readTokens: Token[] = [];
	#readTokenIndex: number = 0;
	#ruleStack: Node[] = [];
	#eofToken: Token | null = null;

	constructor(tokens: Iterable<Token>) {
		this.#tokens = tokens[Symbol.iterator]();
	}

	done(): boolean {
		return this.#readTokenIndex === 0 && !!this.#eofToken;
	}

	parse(): Node {
		return this.#parseExpressions('eof');
	}

	#parseExpressions(endTokenType: TokenType): Node {
		return this.#rule('expressions', () => {
			this.#consumeWhitespace();

			while (!this.done() && !this.#matches(endTokenType)) {
				const prevToken = this.#peek();

				try {
					this.#addChild(this.#parseExpression());
					this.#consumeWhitespace();

					// const token = this.#peekNonWhitespace();

					// if (token.type !== endTokenType) {
					// 	this.#whitespace();
					// }
					// else if (allowTrailingWhitespace && this.#matches('whitespace')) {
					// 	this.#whitespace();
					// }
					// else {
					// 	this.#noWhitespace();
					// }
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

	#parseExpression(): Node {
		return this.#parseOperations();
	}

	#parseOperations(): Node {
		return this.#parseOperationsBoolean();
	}

	#parseOperationsBoolean(): Node {
		return this.#parseBinaryOperation(
			['and', 'or'],
			() => this.#parseOperationsNot()
		);
	}

	#parseOperationsNot(): Node {
		return this.#parseUnaryOperation(
			['not'],
			() => this.#parseOperationsComparison()
		);
	}

	#parseOperationsComparison(): Node {
		return this.#parseBinaryOperation(
			['<', '<=', '=', '>', '>='],
			() => this.#parseOperationsAddition()
		);
	}

	#parseOperationsAddition(): Node {
		return this.#parseBinaryOperation(
			['+', '-'],
			() => this.#parseOperationsMultiplication()
		);
	}

	#parseOperationsMultiplication(): Node {
		return this.#parseBinaryOperation(
			['*', '/', '/_', '/^'],
			() => this.#parseOperationsSign()
		);
	}
	
	#parseOperationsSign(): Node {
		return this.#parseUnaryOperation(
			['+', '-'],
			() => this.#parseOperand()
		);
	}

	#parseBinaryOperation(operators: TokenType[], parseOperand: () => Node): Node {
		let left = parseOperand();

		while (operators.includes(this.#peekNonWhitespace().type)) {
			left = this.#rule('binaryOperation', () => {
				this.#addChild(left);
				this.#consumeWhitespace();
				this.#advance();
				this.#consumeWhitespace();
				this.#addChild(parseOperand());
				this.#consumeWhitespace();
			});
		}

		return left;
	}

	#parseUnaryOperation(operators: TokenType[], parseOperand: () => Node): Node {
		if (!operators.includes(this.#peek().type)) {
			return parseOperand();
		}

		return this.#rule('unaryOperation', () => {
			this.#advance();
			this.#skipWhitespace();
			this.#addChild(this.#parseUnaryOperation(operators, parseOperand));
		});
	}

	#parseOperand(): Node {
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

	#parseNumber(): Node {
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

	#parseBoolean(): Node {
		return this.#rule('boolean', () => {
			if (!this.#expect('true')) {
				this.#require('false');
			}
		});
	}

	#parseReference(): Node {
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

	#parseIf(): Node {
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

			if (this.#matches('if')) {
				this.#addChild(this.#parseIf());
			}
			else {
				this.#require('{');
				this.#addChild(this.#parseExpressions('}'));
				this.#require('}');
			}
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

	// #whitespace() {
	// 	if (!this.#expect('whitespace')) {
	// 		const token: Token = {
	// 			kind: 'token',
	// 			type: 'whitespace',
	// 			value: ' ',
	// 			location: this.#peek().location,
	// 		};

	// 		this.#addChild(token);
	// 	}
	// }

	// #noWhitespace() {
	// 	if (this.#matches('whitespace')) {
	// 		this.#readTokens.splice(this.#readTokenIndex, 1);
	// 	}
	// }

	#peekNonWhitespace() {
		return this.#matches('whitespace') ? this.#peek(1) : this.#peek();
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

	#addChild(child: Node | Token) {
		this.#ruleStack.at(-1)!.children.push(child);
	}

	#status(status: NodeStatus) {
		const node = this.#node();

		if (node) {
			node.status = status;
		}
	}

	#node(): Node | null {
		return this.#ruleStack.at(-1) ?? null;
	}

	#rule(nodeType: NodeType, factory: () => void): Node {
		const rule: Node = { kind: 'cst', type: nodeType, children: [], status: 'ok' };

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