import type { ComponentProps} from 'solid-js';
import { createRenderEffect, onMount, splitProps } from 'solid-js';
import inputStyles from './input.module.scss';
import styles from './TextAreaInput.module.scss';
import { classes } from 'utils/Css';
import type { Overwrite } from 'types/Utility';

export type TextAreaInputProps = Overwrite<Omit<ComponentProps<'pre'>, 'children'>, {
	value?: string;
	onInput?: (value: string, event: InputEvent) => void;
	placeholder?: string;
}>;

export default function TextAreaInput(props: TextAreaInputProps) {
	let ref!: HTMLPreElement;
	const [, propsRest] = splitProps(props, ['class', 'classList', 'onInput', 'value']);
	const value = () => props.value ?? '';
	const nodeValue = () => ref?.firstChild?.nodeValue ?? '';

	const classList = () => ({
		[styles.empty]: value() === '',
		...props.classList
	});

	const onInput = (event: InputEvent) => {
		ref.normalize();
		
		props.onInput?.(nodeValue(), event);
	}

	const updateValue = () => {
		const oldValue = nodeValue();
		const newValue = value();

		if (ref && newValue !== oldValue) {
			ref.textContent = newValue;
			ref.normalize();
		}
	}

	onMount(updateValue);
	createRenderEffect(updateValue);

	return (
		<pre
			ref={ref}
			class={classes(inputStyles.input, styles.input, props.class)}
			classList={classList()}
			onInput={onInput}
			contentEditable="plaintext-only"
			{...propsRest}
		/>
	);
}