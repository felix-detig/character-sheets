import type { ComponentProps} from 'solid-js';
import { createRenderEffect, onMount, splitProps } from 'solid-js';
import inputStyles from './input.module.scss';
import styles from './TextAreaInput.module.scss';
import { classes } from 'utils/Css';
import { createIsMounted, handleEventHandlerUnion } from 'utils/Solid';

export type TextAreaInputProps = {
	value?: string;
	onInput?: (value: string) => void;
	placeholder?: string;
} & Omit<ComponentProps<'div'>, 'onInput' | 'children'>;

function getSelectionOffset(node: HTMLElement): [Node, number] | null {
	const selection = window.getSelection();
	
	if (!selection) {
		return null;
	}
	
	
	for (let i = 0; i < selection.rangeCount; i++) {
		const range = selection.getRangeAt(i);
		
		const leftNode = selection.direction === 'backward' ? (
			range.endContainer
		) : (
			range.startContainer
		);
		
		if (node.contains(leftNode)) {
			const offset = selection.direction === 'backward' ? range.endOffset : range.startOffset;

			return [leftNode, offset];
		}
		
		const rightNode = selection.direction === 'backward' ? (
			range.startContainer
		) : (
			range.endContainer
		);
		
		if (node.contains(rightNode)) {
			return [rightNode, 0];
		}
	}

	return null;
}

function nextInputEvent(node: HTMLElement): Promise<InputEvent> {
	return new Promise((resolve, reject) => {
		const onInput = (event: Event) => {
			console.log('input')
			cleanup();
			resolve(event as InputEvent);
		}
		
		const onBeforeInput = () => {
			console.log('beforeinput')
			cleanup();
			reject();
		}

		const cleanup = () => {
			node.removeEventListener('input', onInput);
			node.removeEventListener('beforeinput', onBeforeInput);
		}

		node.addEventListener('input', onInput);
		node.addEventListener('beforeinput', onBeforeInput);
	});
}

export default function TextAreaInput(props: TextAreaInputProps) {
	let ref!: HTMLDivElement;
	const [, propsRest] = splitProps(props, ['class', 'classList', 'onInput', 'value']);
	const value = () => props.value ?? '';
	const isMounted = createIsMounted();

	const classList = () => ({
		[styles.empty]: value() === '',
		...props.classList
	});

	const onInput = (event: InputEvent) => {
		const target = event.target as HTMLDivElement;
		
		props.onInput?.(target.textContent ?? '');
	}

	const onBeforeInput = (event: InputEvent) => {
		if (props.onBeforeInput) {
			const userReturn = handleEventHandlerUnion(props.onBeforeInput, event) as any;

			if (userReturn === false || event.defaultPrevented) {
				return false;
			}
		}

		console.log(1)
		
		const selectionOffset = getSelectionOffset(ref);
		
		if (selectionOffset === null) {
			return;
		}

		const [node, offset] = selectionOffset;

		console.log(2)
		
		nextInputEvent(ref).then(event => {
			console.log(3)
			if (!isMounted()) {
				return;
			}
			console.log(4)
			
			const selection = window.getSelection();
			
			if (!selection) {
				return;
			}
			console.log(5)

			const newCursorPosition = offset + (event.data ? event.data.length : 0);
			const newRange = document.createRange();
			
			console.log(ref, newRange)
			newRange.setStart(ref, newCursorPosition);
			newRange.collapse();
			selection.removeAllRanges();
			selection.addRange(newRange);
		}).catch(console.error);
	}

	const updateValue = () => {
		const newValue = value();

		if (ref) {
			ref.textContent = newValue;
		}
	}

	onMount(updateValue);
	createRenderEffect(updateValue);

	return (
		<div
			ref={ref}
			class={classes(inputStyles.input, styles.input, props.class)}
			classList={classList()}
			onInput={onInput}
			onBeforeInput={onBeforeInput}
			contentEditable="plaintext-only"
			{...propsRest}
		/>
	);
}