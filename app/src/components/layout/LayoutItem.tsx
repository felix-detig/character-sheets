import LayoutDropPreview from 'components/layout/LayoutDropPreview';
import LayoutValue from 'components/layout/LayoutValue';
import LayoutUnknown from 'components/layout/LayoutUnknown';
import type { SheetLayoutItem } from 'sheet';

export type LayoutItemProps = {
	item: SheetLayoutItem;
};

export default function LayoutItem(props: LayoutItemProps) {
	return (
		<>
			{props.item.type === 'preview' ? (
				<LayoutDropPreview />
			) : props.item.type === 'value' ? (
				<LayoutValue valueId={props.item.valueId} />
			) : (
				<LayoutUnknown />
			)}
		</>
	);
}