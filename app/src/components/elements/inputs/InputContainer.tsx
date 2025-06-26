import { splitProps, type ValidComponent } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { PropsWithOptionalComponent } from 'types/Solid';
import inputStyles from './input.module.scss';
import { classes } from 'utils/Css';

export type InputContainerProps<T extends ValidComponent = 'div'> = PropsWithOptionalComponent<T>;

export default function InputContainer<T extends ValidComponent = 'div'>(
	props: InputContainerProps<T>
) {
	const [, propsRest] = splitProps(props, ['class', 'component']);

	return (
		<Dynamic
			class={classes(inputStyles.input, props.class)}
			component={props.component ?? 'div'}
			{...propsRest}
		/>
	);
}