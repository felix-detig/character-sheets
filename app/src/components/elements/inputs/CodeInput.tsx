import type { ComponentProps } from 'solid-js';
import { splitProps } from 'solid-js';
import inputStyles from './input.module.scss';
import styles from './CodeInput.module.scss';
import { classes } from 'utils/Css';
import type { Overwrite } from 'types/Utility';
import * as Html from 'utils/Html';

// https://stackoverflow.com/a/4812022
function getSelectionRange(container: HTMLElement): { start: number | null, end: number | null } {
	const selection = getSelection();

	if (!selection || !selection.rangeCount) {
		return { start: null, end: null };
	}

	const range = selection.getRangeAt(0);
	const containerRange = range.cloneRange();

	containerRange.selectNodeContents(container);

	containerRange.setEnd(range.startContainer, range.startOffset);
	const start = containerRange.toString().length;

	containerRange.setEnd(range.endContainer, range.endOffset);
	const end = containerRange.toString().length;

	return { start, end };
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

export type CodeInputProps = Overwrite<ComponentProps<'div'>, {
	onInput?: (value: string, event: InputEvent) => void;
	placeholder?: string;
}>;

export default function CodeInput(props: CodeInputProps) {
	let ref!: HTMLDivElement;
	const [, propsRest] = splitProps(props, [
		'class',
		'classList',
		'onInput',
		'onBeforeInput',
		'children',
	]);
	const textContent = () => ref.innerText?.slice(0, -1) ?? '';

	const classList = () => ({
		[styles.empty]: !props.children,
		...props.classList
	});

	const onBeforeInput = (event: InputEvent) => {
		event.preventDefault();

		let { start, end } = getSelectionRange(ref);

		if (start === null || end === null) {
			return;
		}

		if (start === end) {
			// TODO: other delete* types?
			if (event.inputType === 'deleteContentBackward') {
				start -= 1;
			}
			else if (event.inputType === 'deleteContentForward') {
				end += 1;
			}
		}

		const prevValue = textContent();
		const newValueStart = prevValue.slice(0, start);
		const newValueEnd = prevValue.slice(end);
		const inserted = getInsertedText(event);

		const newValue = newValueStart + inserted + newValueEnd;
		
		props.onInput?.(newValue, event);

		Html.setCursor(ref, (newValueStart + inserted).length);
	}

	return (
		<div
			ref={ref}
			class={classes(inputStyles.input, styles.input, props.class)}
			classList={classList()}
			onBeforeInput={onBeforeInput}
			contentEditable="plaintext-only"
			{...propsRest}
		>
			{props.children}
			<br />
		</div>
	);
}