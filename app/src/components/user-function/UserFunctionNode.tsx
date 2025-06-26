import type { PropsWithClass } from 'types/Solid';
import type { Cst } from 'user-function';
import UserFunctionNodeDefault from './UserFunctionNodeDefault';

export type UserFunctionNodeProps = PropsWithClass & {
	node: Cst.Node;
};

export default function UserFunctionNode(props: UserFunctionNodeProps) {
	return (
		<UserFunctionNodeDefault {...props} />
	);
}