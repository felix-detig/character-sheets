import InputContainer from 'components/elements/inputs/InputContainer';
import { splitProps, type ComponentProps } from 'solid-js';
import { classes } from 'utils/Css';
import styles from './UserFunctionEditableContainer.module.scss';

export type UserFunctionEditableContainerProps = ComponentProps<'div'>;

export default function UserFunctionEditableContainer(props: UserFunctionEditableContainerProps) {
	const [, propsRest] = splitProps(props, ['class']);

	return (
		<InputContainer
			class={classes(styles.container, props.class)}
			contentEditable="plaintext-only"
			{...propsRest}
		/>
	);
}