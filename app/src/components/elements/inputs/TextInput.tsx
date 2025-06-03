import type { ComponentProps} from 'solid-js';
import { createRenderEffect, splitProps } from 'solid-js';
import { classes } from 'utils/Css';
import inputStyles from './input.module.scss';

export type TextInputProps = {
	onInput?: (value: string) => void;
} & Omit<ComponentProps<'input'>, 'type' | 'onInput'>;

export default function TextInput(props: TextInputProps) {
	let ref!: HTMLInputElement;
	const [, propsRest] = splitProps(props, ['onInput', 'class']);

	const onInput = (event: InputEvent) => {
		const target = event.target as HTMLInputElement;
		
		props.onInput?.(target.value);
	}

	createRenderEffect(() => {
		if (ref) {
			ref.value = '' + props.value;
		}
	});

	return (
		<input
			ref={ref}
			type="text"
			class={classes(inputStyles.input, props.class)}
			onInput={onInput}
			{...propsRest}
		/>
	);
}