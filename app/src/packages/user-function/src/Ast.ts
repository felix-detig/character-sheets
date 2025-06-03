import type { UserFunctionContext } from './types';
import type { Token, TokenTypeBinaryOperator } from './Token';

// TODO error on 0 division

export type Node =
	IfNode |
	BinaryOperationNode |
	UnaryOperationNode |
	ReferenceNode |
	NumberNode |
	BooleanNode;

export function evaluate(node: Node, context: UserFunctionContext): number | boolean {
	return node.evaluate(context) ?? 0;
}

abstract class NodeBase<T extends string> {

	abstract type: T;
	abstract evaluate(context: UserFunctionContext): number | boolean | null;
	
	boolean(context: UserFunctionContext): boolean;
	boolean(context: UserFunctionContext, defaultValue: boolean): boolean;
	boolean(context: UserFunctionContext, defaultValue: null): boolean | null;
	boolean(context: UserFunctionContext, defaultValue?: boolean | null): boolean | null {
		const value = this.evaluate(context);

		if (typeof value === 'boolean') {
			return value;
		}
		else if (value === null && defaultValue !== undefined) {
			return defaultValue;
		}
		
		throw new Error(`Expected a boolean, found '${typeof value}'!`);
	}
	
	number(context: UserFunctionContext): number;
	number(context: UserFunctionContext, defaultValue: number): number;
	number(context: UserFunctionContext, defaultValue: null): number | null;
	number(context: UserFunctionContext, defaultValue?: number | null): number | null {
		const value = this.evaluate(context);

		if (typeof value === 'number') {
			return value;
		}
		else if (value === null && defaultValue !== undefined) {
			return defaultValue;
		}
		
		throw new Error(`Expected a number, found '${typeof value}'!`);
	}

}

export class IfNode extends NodeBase<'if'> {

	condition: Node;
	trueBranch: Node;
	falseBranch: Node | null;
	
	get type(): 'if' {
		return 'if';
	}

	constructor(condition: Node, trueBranch: Node, falseBranch: Node | null) {
		super();

		this.condition = condition;
		this.trueBranch = trueBranch;
		this.falseBranch = falseBranch;
	}

	evaluate(context: UserFunctionContext): number | boolean | null {
		if (this.condition.evaluate(context)) {
			return this.trueBranch.evaluate(context);
		}
		else {
			return this.falseBranch?.evaluate(context) ?? null;
		}
	}

	toString(): string {
		const condition = this.condition.toString();
		const trueBranch = this.trueBranch.toString();
		const falseBranch = this.falseBranch?.toString() ?? null;

		return `((${condition}) ? (${trueBranch}) : (${falseBranch}))`;
	}

}

export class BinaryOperationNode extends NodeBase<TokenTypeBinaryOperator> {

	left: Node;
	operator: Token;
	right: Node;
	
	get type(): TokenTypeBinaryOperator {
		return this.operator.type as TokenTypeBinaryOperator;
	}

	constructor(left: Node, operator: Token, right: Node) {
		super();

		this.left = left;
		this.operator = operator;
		this.right = right;
	}

	evaluate(context: UserFunctionContext): number | boolean {
		switch (this.operator.type) {
			case '+':
				return this.left.number(context, 0) + this.right.number(context, 0);

			case '-':
				return this.left.number(context, 0) - this.right.number(context, 0);

			case '*':
				return this.left.number(context, 1) * this.right.number(context, 1);

			case '/':
				return this.left.number(context, 1) / this.right.number(context, 1);

			case '/_':
				return Math.floor(this.left.number(context, 1) / this.right.number(context, 1));

			case '/^':
				return Math.ceil(this.left.number(context, 1) / this.right.number(context, 1));

			case '<':
				return this.left.number(context) < this.right.number(context);
				
			case '>':
				return this.left.number(context) > this.right.number(context);

			case '<=':
				return this.left.number(context) <= this.right.number(context);

			case '>=':
				return this.left.number(context) >= this.right.number(context);

			case '=': {
				const left = this.left.evaluate(context);
				const right = this.right.evaluate(context);

				if (left === null || right === null) {
					throw new Error('Undefined operand!');
				}

				if (typeof left !== typeof right) {
					throw new Error(`Operand type mismatch: '<${typeof left}> = <${typeof right}>'!`);
				}

				return left === right;
			}

			case 'and':
				return this.left.boolean(context, true) && this.right.boolean(context, true);
			
			case 'or':
				return this.left.boolean(context, false) || this.right.boolean(context, false);
		}

		throw new Error(`Invalid operation '${this.operator.value}'!`);
	}

}

export class UnaryOperationNode extends NodeBase<'not' | 'positive' | 'negative'> {

	operator: Token;
	operand: Node;

	get type(): 'not' | 'positive' | 'negative' {
		switch (this.operator.type) {
			case 'not':
				return 'not';

			case '+':
				return 'positive';

			case '-':
				return 'negative';
		}

		throw new Error(`Invalid operator '${this.operator.type}'!`);
	}

	constructor(operator: Token, operand: Node) {
		super();

		this.operator = operator;
		this.operand = operand;
	}

	evaluate(context: UserFunctionContext): number | boolean {
		switch (this.operator.type) {
			case 'not':
				return !this.operand.boolean(context);

			case '+':
				return +this.operand.number(context);

			case '-':
				return -this.operand.number(context);
		}
		
		throw new Error(`Invalid operator '${this.operator.type}'!`);
	}

}

export class ReferenceNode extends NodeBase<'reference'> {

	path: string[];
	
	get type(): 'reference' {
		return 'reference';
	}

	constructor(path: string[]) {
		super();

		this.path = path;
	}

	evaluate(context: UserFunctionContext): number | boolean {
		const value = context.get(this.path);

		if (value === undefined) {
			throw new Error(`Unknown id '#${this.path.join('.')}'!`);
		}

		return value;
	}

}

export class NumberNode extends NodeBase<'number'> {

	value: number;

	get type(): 'number' {
		return 'number';
	}

	constructor(value: number) {
		super();

		this.value = value;
	}

	evaluate(): number {
		return this.value;
	}

}

export class BooleanNode extends NodeBase<'boolean'> {

	value: boolean;

	get type(): 'boolean' {
		return 'boolean';
	}

	constructor(value: boolean) {
		super();

		this.value = value;
	}

	evaluate(): boolean {
		return this.value;
	}

}