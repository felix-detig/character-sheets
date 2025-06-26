import { splitProps, type ComponentProps } from 'solid-js';
import type { Overwrite } from 'types/Utility';
import styles from './UserFunctionInput.module.scss';
import inputStyles from '../elements/inputs/input.module.scss';
import { classes } from 'utils/Css';
import * as Html from 'utils/Html';
import UserFunctionCode from 'components/user-function/UserFunctionCode';
import { UserFunctionInputProvider } from 'state/UserFunctionInput';
import type { Token } from 'user-function';
import UserFunctionEditableContainer from 'components/user-function/UserFunctionEditableContainer';

// https://stackoverflow.com/a/4812022
function getSelectionRange(container: HTMLElement): [start: number | null, end: number | null] {
	const selection = getSelection();

	if (!selection || !selection.rangeCount) {
		return [null, null];
	}

	const range = selection.getRangeAt(0);
	const containerRange = range.cloneRange();

	containerRange.selectNodeContents(container);

	containerRange.setEnd(range.startContainer, range.startOffset);
	const start = containerRange.toString().length;

	containerRange.setEnd(range.endContainer, range.endOffset);
	const end = containerRange.toString().length;

	return [start, end];
}

function getInsertedText(event: InputEvent): string {
	if (!event.inputType.startsWith('insert')) {
		return '';
	}

	if (event.data) {
		return event.data;
	}

	if (event.dataTransfer) {
		return event.dataTransfer.getData('text');
	}
	
	return '\n';
}

function getDeletedRange(
	_value: string,
	start: number,
	end: number,
	event: InputEvent
): [start: number, end: number] {
	if (event.inputType.startsWith('delete') && start === end) {
		// TODO: more specific delete* types?
		if (event.inputType.endsWith('Forward')) {
			end += 1;
		}
		else {
			start -= 1;
		}
	}

	return [start, end];
}

export type UserFunctionInputProps = Overwrite<
	Omit<ComponentProps<'div'>, 'children'>,
	{
		value: string;
		onInput?: (value: string, event: InputEvent) => void;
		placeholder?: string;
	}
>;

export default function UserFunctionInput(props: UserFunctionInputProps) {
	let ref!: HTMLDivElement;
	const [, propsRest] = splitProps(props, [
		'class',
		'classList',
		'onInput',
		'onBeforeInput',
	]);
	const nodesByToken = new Map<Token, Node>();
	const tokensByNode = new Map<Node, Token>();

	const classList = () => ({
		[styles.empty]: !props.value,
		...props.classList
	});

	const tokenNodeParent = (node: Node): Node | null => {
		while (node !== ref && node !== document.body) {
			if (tokensByNode.has(node)) {
				return node;
			}

			node = node.parentNode!;
		}

		return null;
	}

	const getSelectionRange = (): { start: number, end: number } | null => {
		const selection = window.getSelection();

		if (!selection || !selection.rangeCount) {
			return null;
		}

		const range = selection.getRangeAt(0);
		const startNode = tokenNodeParent(range.startContainer);
		const endNode = tokenNodeParent(range.endContainer);

		if (!startNode || !endNode) {
			// console.log('no token parents!');
			// return null;
			
			// TODO can this happen if selection ends up inside if node?
			return { start: 0, end: 0 };
		}

		const startToken = tokensByNode.get(startNode)!;
		const startNodeOffset = Html.parentOffset(startNode, range.startContainer);
		const start = startToken.location.position + startNodeOffset + range.startOffset;

		const endToken = tokensByNode.get(endNode)!;
		const endNodeOffset = Html.parentOffset(endNode, range.endContainer);
		const end = endToken.location.position + endNodeOffset + range.endOffset;

		return { start, end };
	}

	const onBeforeInput = (event: InputEvent) => {
		event.preventDefault();

		const selected = getSelectionRange();

		if (!selected) {
			return;
		}

		const prevValue = props.value;
		const [start, end] = getDeletedRange(prevValue, selected.start, selected.end, event);

		const newValueStart = prevValue.slice(0, start);
		const newValueEnd = prevValue.slice(end);
		const inserted = getInsertedText(event);
		const newValue = newValueStart + inserted + newValueEnd;
		
		props.onInput?.(newValue, event);

		// Html.setCursor(ref, (newValueStart + inserted).length);
	}

	const setTokenBinding = (token: Token, html: Node) => {
		nodesByToken.set(token, html);
		tokensByNode.set(html, token);
	}

	const removeTokenBinding = (token: Token, html: Node) => {
		nodesByToken.delete(token);
		tokensByNode.delete(html);
	}

	return (
		<UserFunctionInputProvider value={{ setTokenBinding, removeTokenBinding }}>
			<UserFunctionEditableContainer
				ref={ref}
				class={classes(styles.input, props.class)}
				classList={classList()}
				onBeforeInput={onBeforeInput}
				spellcheck={false}
				// @ts-ignore
				writingsuggestions="false"
				{...propsRest}
			>
				<UserFunctionCode value={props.value} />
				<br />
			</UserFunctionEditableContainer>
		</UserFunctionInputProvider>
	);
}