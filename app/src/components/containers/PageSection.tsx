import { splitProps, type ParentProps, type ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web';
import type { PropsWithClass, PropsWithOptionalComponent } from 'types/Solid';
import type { Overwrite } from 'types/Utility';
import { classes } from 'utils/Css';
import styles from './PageSection.module.scss';

export type PageSectionProps<T extends ValidComponent = 'section'> = Overwrite<
	PropsWithOptionalComponent<T>,
	{
		alt?: boolean;
		fullWidth?: boolean;
		grow?: boolean;
		scroll?: boolean;
		childrenContainerClass?: string;
	}
> & PropsWithClass & ParentProps;

export default function PageSection<T extends ValidComponent = 'section'>(
	props: PageSectionProps<T>
) {
	const [, propsRest] = splitProps(props, ['component', 'class', 'classList', 'children']);
	const classList = () => ({
		[styles.alt]: props.alt,
		[styles.grow]: props.grow,
		[styles.fullWidth]: props.fullWidth,
		[styles.scroll]: props.scroll,
		...props.classList,
	});

	return (
		<Dynamic
			component={props.component ?? 'div'}
			class={classes(styles.section, props.class)}
			classList={classList()}
			{...propsRest}
		>
			<div class={classes(styles.children, props.childrenContainerClass)}>
				{props.children}
			</div>
		</Dynamic>
	);
}