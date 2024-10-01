import { PropsWithClass, PropsWithOptionalComponent } from 'types/Props';
import styles from './Expandable.module.scss';
import { ParentProps, ValidComponent, createEffect, createSignal, onCleanup, splitProps, untrack } from 'solid-js';
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
		'component'
	]);
	const animationDurationMs = () => propsOwn.transitionDurationMs ?? 200;
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
		propsOwn.expanded;
		setAnimationIsFinished(false);

		const timeout = setTimeout(() => {
			setAnimationIsFinished(true);

			if (propsOwn.expanded) {
				untrack(() => propsOwn.onExpandFinished?.());
			}
			else {
				untrack(() => propsOwn.onCollapseFinished?.());
			}
		}, untrack(() => animationDurationMs()));
		
		onCleanup(() => {
			clearTimeout(timeout);
		});
	});

	return (
		<Dynamic
			component={propsOwn.component ?? 'div'}
			class={classes(propsOwn.class, styles.expandable)}
			classList={classList()}
			style={{ '--expandable-transition-duration': `${animationDurationMs()}ms` }}
			{...propsRest}
		>
			<div class={styles.content} classList={contentClassList()}>
				{propsOwn.children}
			</div>
		</Dynamic>
	);
}