import { splitProps, type ComponentProps, type ValidComponent } from 'solid-js';
import styles from './Button.module.scss';
import { classes } from 'utils/Css';
import type { PropsWithOptionalComponent } from 'types/Solid';
import { Dynamic } from 'solid-js/web';

export type ButtonProps<T extends ValidComponent = 'button'> =
	ComponentProps<T> & PropsWithOptionalComponent<T>;

export default function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>) {
	const [, propsRest] = splitProps(props, ['class']);

	return (
		<Dynamic
			component={props.component ?? 'button'}
			class={classes(styles.button, props.class)}
			{...propsRest}
		/>
	);
}