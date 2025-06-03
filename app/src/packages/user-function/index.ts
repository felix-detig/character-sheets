import type { UserFunctionContext } from './src/types';
import type { Token } from './src/Token';
import CstParser from './src/CstParser';
import AstParser from './src/AstParser';
import Tokenizer from './src/Tokenizer';
import { evaluate } from './src/Ast';
import type * as Ast from './src/Ast';
import type * as Cst from './src/Cst';
import { time } from 'utils/Debug';

export type * from './src/types';
export type * from './src/Token';
export { Tokenizer, CstParser, AstParser };
export type { Cst, Ast };

export function interpret(input: Iterable<string>, context: UserFunctionContext): number | boolean {
	const tokenizer = new Tokenizer(input);
	const parser = new AstParser(tokenizer.tokenize());
	const program = parser.parse();

	return evaluate(program, context);
}

export function interpretTime(
	input: Iterable<string>,
	context: UserFunctionContext
): number | boolean {
	let tokens!: Iterable<Token>;
	let ast!: Ast.Node;
	let value!: number | boolean;

	time('tokenize', () => {
		const tokenizer = new Tokenizer(input);
		tokens = tokenizer.tokenize();
	});

	time('parse', () => {
		const parser = new AstParser(tokens);
		ast = parser.parse();
	});

	time('evaluate', () => {
		value = evaluate(ast, context);
	});

	return value;
}