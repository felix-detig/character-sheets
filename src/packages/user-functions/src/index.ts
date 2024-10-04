import { UserFunctionContext } from './types';
import Parser from './Parser';
import Tokenizer from './Tokenizer';
import { evaluate } from './Ast';

export type * from './types';
export { Parser, Tokenizer };

export function interpret(input: Iterable<string>, context: UserFunctionContext): number | boolean {
	const tokenizer = new Tokenizer(input);
	const parser = new Parser(tokenizer.tokenize());
	const program = parser.parse();

	return evaluate(program, context);
}