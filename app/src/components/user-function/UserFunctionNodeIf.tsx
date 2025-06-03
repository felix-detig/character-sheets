import type { PropsWithClass } from 'types/Solid';
import type { Cst } from 'user-function';

export type UserFunctionNodeIfProps = PropsWithClass & {
	node: Extract<Cst.Node, { type: 'if' }>;
};

export default function UserFunctionNodeIf(props: UserFunctionNodeIfProps) {
	return (
		<></>
	);
}