import { ComponentProps, createRenderEffect, splitProps } from 'solid-js';

export type TextInputProps = {
	onInput: (value: string) => void
} & Omit<ComponentProps<'input'>, 'type' | 'onInput'>;

export default function TextInput(props: TextInputProps) {
	let ref!: HTMLInputElement;
	const [, propsRest] = splitProps(props, ['onInput']);

	const onInput = (event: InputEvent) => {
		if (!event.target) {
			return;
		}

		const target = event.target as HTMLInputElement;
		
		props.onInput(target.value);
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
			onInput={onInput}
			// size="1"
			{...propsRest}
		/>
	);
}