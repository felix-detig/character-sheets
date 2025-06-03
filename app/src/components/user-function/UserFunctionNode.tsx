import { For } from 'solid-js';
import UserFunctionToken from 'components/user-function/UserFunctionToken';
import type { PropsWithClass } from 'types/Solid';
import type { Cst } from 'user-function';
import styles from './UserFunctionNode.module.scss';

export type UserFunctionNodeProps = PropsWithClass & {
	node: Cst.Node;
};

export default function UserFunctionNode(props: UserFunctionNodeProps) {
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
						{child.kind === 'cst' ? (
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