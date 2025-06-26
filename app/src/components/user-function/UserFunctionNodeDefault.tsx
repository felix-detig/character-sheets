import { For } from 'solid-js';
import UserFunctionToken from 'components/user-function/UserFunctionToken';
import type { PropsWithClass } from 'types/Solid';
import type { Cst } from 'user-function';
import styles from './UserFunctionNodeDefault.module.scss';
import UserFunctionNode from './UserFunctionNode';
import UserFunctionNodeIf from 'components/user-function/UserFunctionNodeIf';

export type UserFunctionNodeDefaultProps = PropsWithClass & {
	node: Cst.Node;
};

export default function UserFunctionNodeDefault(props: UserFunctionNodeDefaultProps) {
	const classList = () => ({
		[styles.ok]: props.node.status === 'ok',
		[styles.error]: props.node.status === 'error',
		...props.classList,
	});

	return (
		<span class={(props.class, styles[props.node.type])} classList={classList()}>
			<For each={props.node.children}>
				{child => (
					<>
						{(child.kind === 'cst' && child.type === 'if') ? (
							<UserFunctionNodeIf node={child} />
						) : child.kind === 'cst' ? (
							<UserFunctionNode node={child} />
						) : (
							<UserFunctionToken token={child} />
						)}
					</>
				)}
			</For>
		</span>
	);
}