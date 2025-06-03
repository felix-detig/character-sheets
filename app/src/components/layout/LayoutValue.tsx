import Card from 'components/containers/Card';
import type { SheetValueId } from 'sheet';
import { useGetterValue } from 'state/GetterGraph';
import type { PropsWithClass } from 'types/Solid';
import styles from './LayoutElement.module.scss';
import { useSheet } from 'state/Sheet';
import { A } from '@solidjs/router';

export type LayoutElementProps = PropsWithClass & { valueId: SheetValueId };

export default function LayoutValue(props: LayoutElementProps) {
	const [sheet] = useSheet();
	const element = () => props.valueId ? sheet.values[props.valueId] : null;
	const value = useGetterValue(() => props.valueId);

	return (
		<A class={styles.a} href={`/elements/edit/${props.valueId}`}>
			<Card class={styles.container}>
				{element() ? (
					<>
						<span>{element()!.title}</span>
						<span>{'' + value()}</span>
					</>
				) : (
					<span>Unknown element</span>
				)}
			</Card>
		</A>
	);
}