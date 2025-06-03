import type { PropsWithClass, PropsWithOptionalComponent } from 'types/Solid';
import styles from './Expandable.module.scss';
import type { ParentProps, ValidComponent} from 'solid-js';
import { createEffect, createSignal, onCleanup, splitProps, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { classes } from 'utils/Css';

export type ExpandableProps<T extends ValidComponent> = {
	horizontal?: boolean,
	expanded?: boolean,
	transitionDurationMs?: number,
	onExpandFinished?: () => void,
	onCollapseFinished?: () => void,
} & ParentProps & PropsWithClass & PropsWithOptionalComponent<T>;

export default function Expandable<T extends ValidComponent = 'div'>(props: ExpandableProps<T>) {
	const [animationIsFinished, setAnimationIsFinished] = createSignal(true);
	const [propsOwn, propsRest] = splitProps(props, [
		'horizontal',
		'expanded',
		'transitionDurationMs',
		'onExpandFinished',
		'onCollapseFinished',
		'children',
		'class',
		'classList',
		'style',
		'component'
	]);
	const transitionDurationMs = () => propsOwn.transitionDurationMs ?? 200;
	const classList = () => ({
		...propsOwn.classList,
		[styles.horizontal]: propsOwn.horizontal,
		[styles.vertical]: !propsOwn.horizontal,
		[styles.expanded]: propsOwn.expanded,
		[styles.animationFinished]: animationIsFinished()
	});
	const contentClassList = () => ({
		[styles.animationFinished]: animationIsFinished()
	});

	createEffect(() => {
		setAnimationIsFinished(false);

		const duration = untrack(() => transitionDurationMs());
		const timeout = setTimeout(() => {
			setAnimationIsFinished(true);

			if (propsOwn.expanded) {
				untrack(() => propsOwn.onExpandFinished?.());
			}
			else {
				untrack(() => propsOwn.onCollapseFinished?.());
			}
		}, duration);
		
		onCleanup(() => {
			clearTimeout(timeout);
		});
	});

	return (
		<Dynamic
			component={propsOwn.component ?? 'div'}
			class={classes(propsOwn.class, styles.expandable)}
			classList={classList()}
			style={{
				...props.style,
				'--expandable-transition-duration': `${transitionDurationMs()}ms`
			}}
			{...propsRest}
		>
			<div class={styles.content} classList={contentClassList()}>
				{propsOwn.children}
			</div>
		</Dynamic>
	);
}