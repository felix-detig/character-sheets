import type { PropsWithClass } from 'types/Solid';
import type { Cst, Token } from 'user-function';
import UserFunctionNodeDefault from './UserFunctionNodeDefault';
import { classes } from 'utils/Css';
import styles from './UserFunctionNodeIf.module.scss';
import UserFunctionCst from 'components/user-function/UserFunctionCst';
import { createMemo } from 'solid-js';
import { BsArrowReturnRight } from 'solid-icons/bs';
import UserFunctionEditableContainer from 'components/user-function/UserFunctionEditableContainer';

type StructuredIf = { condition: Cst.Node, then: Cst.Node, else: Cst.Node | null };

function expectNext(
	children: Iterator<Cst.Node | Token>,
	filter: (node: Cst.Node | Token) => boolean
): Cst.Node | Token | null {
	let { value, done } = children.next();

	if (done) {
		return null;
	}

	if (value.type === 'whitespace') {
		({ value, done } = children.next());

		if (done) {
			return null;
		}
	}

	return filter(value) ? value : null;
}

function parseStructuredIf(node: Cst.Node): StructuredIf | null {
	const it = node.children[Symbol.iterator]();

	expectNext(it, node => node.kind === 'token' && node.type === 'if');
	expectNext(it, node => node.type === '{');

	const condition = expectNext(it, node => node.type === 'expressions') as Cst.Node;

	if (!condition) {
		return null;
	}
	
	expectNext(it, node => node.type === '}');
	expectNext(it, node => node.type === '{');

	const then = expectNext(it, node => node.type === 'expressions') as Cst.Node;
	
	if (!then) {
		return null;
	}
	
	expectNext(it, node => node.type === '}');

	if (!expectNext(it, node => node.type === 'else')) {
		return { condition, then, else: null };
	}

	const bracketOrIf = expectNext(it, node => {
		return node.type === '{' || (node.kind === 'cst' && node.type === 'if');
	});
	
	if (!bracketOrIf) {
		return null;
	}

	let elseNode;

	if (bracketOrIf.kind === 'cst') {
		elseNode = bracketOrIf;
	}
	else {
		elseNode = expectNext(it, node => node.type === 'expressions') as Cst.Node;

		if (!expectNext(it, node => node.type === '}')) {
			return null;
		}
	}

	return { condition, then, else: elseNode };
}

export type UserFunctionNodeIfProps = PropsWithClass & {
	node: Cst.Node;
};

export default function UserFunctionNodeIf(props: UserFunctionNodeIfProps) {
	const structured = createMemo(() => parseStructuredIf(props.node));

	return (
		<>
			{structured() ? (
				<div class={classes(props.class, styles.container)} contentEditable={false}>
					<div class={styles.condition}>
						<span class={styles.keyword}>if</span>
						<UserFunctionEditableContainer>
							<UserFunctionCst cst={structured()!.condition} />
						</UserFunctionEditableContainer>
					</div>
					<div class={styles.branch}>
						<span class={styles.keyword}>
							<BsArrowReturnRight />
						</span>
						<UserFunctionEditableContainer>
							<UserFunctionCst cst={structured()!.then} />
						</UserFunctionEditableContainer>
					</div>
					{structured()!.else && (
						<>
							<span class={styles.keyword}>else</span>
							<div class={styles.branch}>
								<span class={styles.keyword}>
									<BsArrowReturnRight />
								</span>
								<UserFunctionEditableContainer>
									<UserFunctionCst cst={structured()!.else!} />
								</UserFunctionEditableContainer>
							</div>
						</>
					)}
				</div>
			) : (
				<UserFunctionNodeDefault {...props} />
			)}
		</>
	);
}