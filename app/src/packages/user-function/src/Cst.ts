import type { Token } from './Token';

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