import { Token } from './types';
import UserFunctionContext from './UserFunctionContext';

export type Node = IfNode | BinaryOperationNode | UnaryOperationNode | ReferenceNode | NumberNode;

abstract class NodeBase<T extends string> {

	abstract type: T;
	abstract evaluate(context: UserFunctionContext): number | boolean;

	boolean(context: UserFunctionContext) {
		const value = this.evaluate(context);

		if (typeof value === 'boolean') {
			return value;
		}
		
		throw new Error(`Expected a boolean, found '${typeof value}'!`);
	}

	number(context: UserFunctionContext) {
		const value = this.evaluate(context);

		if (typeof value === 'number') {
			return value;
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

	evaluate(context: UserFunctionContext): number | boolean {
		if (this.condition.evaluate(context)) {
			return this.trueBranch.evaluate(context);
		}
		else {
			// TODO: work with missing falseBranch
			return this.falseBranch!.evaluate(context);
		}
	}

}

export class BinaryOperationNode extends NodeBase<
	'+' | '-' | '*' | '/' | '/_' | '/^' | 'and' | 'or'
> {

	left: Node;
	operator: Token;
	right: Node;
	
	get type(): '+' | '-' | '*' | '/' | '/_' | '/^' | 'and' | 'or' {
		return this.operator.type as '+' | '-' | '*' | '/' | '/_' | '/^' | 'and' | 'or';
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
				return this.left.number(context) + this.right.number(context);

			case '-':
				return this.left.number(context) - this.right.number(context);

			case '*':
				return this.left.number(context) * this.right.number(context);

			case '/':
				return this.left.number(context) / this.right.number(context);

			case '/_':
				return Math.floor(this.left.number(context) / this.right.number(context));

			case '/^':
				return Math.ceil(this.left.number(context) / this.right.number(context));

			case 'and':
				return this.left.boolean(context) && this.right.boolean(context);
			
			case 'or':
				return this.left.boolean(context) && this.right.boolean(context);
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

		throw new Error(`Invalid operator '${this.operator.type}'`);
	}

	constructor(operator: Token, operand: Node) {
		super();

		this.operator = operator;
		this.operand = operand;
	}

	evaluate(context: UserFunctionContext): boolean {
		return !this.operand.evaluate(context);
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