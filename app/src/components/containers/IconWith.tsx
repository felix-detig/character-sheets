import type { JSX, ParentProps } from 'solid-js'
import type { PropsWithClass } from 'types/Solid';
import styles from './IconWith.module.scss';
import { classes } from 'utils/Css';

export type IconWithProps = {
	icon?: JSX.Element;
	iconPosition?: 'left' | 'right';
} & PropsWithClass & ParentProps;

export function IconWith(props: IconWithProps) {
	const classList = () => ({
		[styles.reverse]: props.iconPosition === 'right',
		...props.classList,
	});

	return (
		<div class={classes(styles.iconWith, props.class)} classList={classList()}>
			{props.icon}
			<div class={styles.children}>
				{props.children}
			</div>
		</div>
	);
}