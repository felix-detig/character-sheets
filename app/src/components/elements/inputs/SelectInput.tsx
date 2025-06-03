import type { Overwrite } from 'types/Utility';
import styles from './SelectInput.module.scss';
import inputStyles from './input.module.scss';
import { createRenderEffect, splitProps, type ComponentProps } from 'solid-js';
import { classes } from 'utils/Css';

export type SelectInputProps = Overwrite<ComponentProps<'select'>, {
	onInput?: (newValue: string, event: InputEvent) => void;
}>;

export default function SelectInput(props: SelectInputProps) {
	const [, propsRest] = splitProps(props, ['class', 'onInput']);
	let ref!: HTMLSelectElement;

	const onInput = (event: InputEvent) => {
		const target = event.target as HTMLSelectElement;
		
		props.onInput?.(target.value, event);
	}

	createRenderEffect(() => {
		if (ref) {
			ref.value = '' + props.value;
		}
	});

	return (
		<select
			class={classes(inputStyles.input, styles.input, props.class)}
			onInput={onInput}
			{...propsRest}
		/>
	);
}