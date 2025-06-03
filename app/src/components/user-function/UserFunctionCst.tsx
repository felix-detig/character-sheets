import UserFunctionNode from 'components/user-function/UserFunctionNode';
import UserFunctionToken from 'components/user-function/UserFunctionToken';
import type { PropsWithClass } from 'types/Solid';
import type { Cst, Token } from 'user-function';

export type UserFunctionCstProps = PropsWithClass & {
	cst: Cst.Node | Token;
};

export default function UserFunctionCst(props: UserFunctionCstProps) {
	return (
		<>
			{props.cst.kind === 'cst' ? (
				<UserFunctionNode node={props.cst} />
			) : (
				<UserFunctionToken token={props.cst} />
			)}
		</>
	);
}