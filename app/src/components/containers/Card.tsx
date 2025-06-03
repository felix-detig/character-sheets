import { splitProps, type ValidComponent } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { PropsWithClass, PropsWithOptionalComponent } from 'types/Solid';
import { classes } from 'utils/Css';
import styles from './Card.module.scss';

export type CardProps<T extends ValidComponent = 'div'> =
	PropsWithClass & PropsWithOptionalComponent<T>;

export default function Card<T extends ValidComponent = 'div'>(props: CardProps<T>) {
	const [, propsRest] = splitProps(props, ['component', 'class']);

	return (
		<Dynamic
			component={props.component ?? 'div'}
			class={classes(styles.card, props.class)}
			{...propsRest}
		/>
	);
}