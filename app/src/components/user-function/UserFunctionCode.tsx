import UserFunctionCst from 'components/user-function/UserFunctionCst';
import { createRenderEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import type { PropsWithClass } from 'types/Solid';
import { CstParser, Tokenizer, type Cst } from 'user-function';

const cstEmpty = {};

export type UserFunctionCodeProps = PropsWithClass & {
	value: string;
};

export default function UserFunctionCode(props: UserFunctionCodeProps) {
	const [cst, setCst] = createStore<Cst.Node | typeof cstEmpty>(cstEmpty);

	createRenderEffect(() => {
		console.time('cst parse');
		const tokenizer = new Tokenizer(props.value ?? '');
		const parser = new CstParser(tokenizer.tokenize());
		const newCst = parser.parse();
		console.timeEnd('cst parse');

		console.time('cst render');
		setCst(reconcile(newCst));
		console.timeEnd('cst render');
	});
	
	return (
		<>
			{cst === cstEmpty ? (
				''
			) : (
				<UserFunctionCst cst={cst as Cst.Node} />
			)}
		</>
	);
}