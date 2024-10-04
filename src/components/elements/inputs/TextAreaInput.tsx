import { ComponentProps, createRenderEffect, splitProps } from 'solid-js';

export type TextAreaInputProps = {
	onInput: (value: string) => void
} & Omit<ComponentProps<'textarea'>, 'onInput'>;

export default function TextAreaInput(props: TextAreaInputProps) {
	let ref!: HTMLTextAreaElement;
	const [, propsRest] = splitProps(props, ['onInput']);

	const onInput = (event: InputEvent) => {
		if (!event.target) {
			return;
		}

		const target = event.target as HTMLTextAreaElement;
		
		props.onInput(target.value);
	}

	createRenderEffect(() => {
		if (ref) {
			ref.value = '' + props.value;
		}
	});

	return (
		// size="1"
		<textarea ref={ref} onInput={onInput} {...propsRest} />
	);
}