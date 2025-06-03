import type { Accessor, JSX, ParentProps} from 'solid-js';
import {
	batch,
	createEffect,
	createMemo,
	createSignal,
	For,
	onCleanup,
	onMount,
	splitProps,
} from 'solid-js';
import styles from './LayoutRoute.module.scss';
import type { SheetElementId, SheetLayout, SheetLayoutItem } from 'sheet';
import { createStore } from 'solid-js/store';
import { classes } from 'utils/Css';
import PageSection from 'components/containers/PageSection';
import { useSheet } from 'state/Sheet';
import SheetLayoutElement from 'components/sheet-elements/SheetLayoutElement';
import Button from 'components/elements/Button';
import { useNavigate } from '@solidjs/router';

function LayoutRow(props: ParentProps) {
	return (
		<div class={styles.row} {...props} />
	);
}

function LayoutCell(props: JSX.IntrinsicElements['div'] & { colSpan: number, elementId?: string }) {
	const [propsOwn, propsRest] = splitProps(props, ['class', 'colSpan', 'elementId', 'ref']);

	return (
		<div
			ref={propsOwn.ref}
			class={classes(propsOwn.class, styles.cell)}
			style={{ 'grid-column-end': 'span ' + props.colSpan }}
			{...(propsOwn.elementId && { 'data-element-id': propsOwn.elementId })}
			{...propsRest}
		/>
	);
}

function layoutRemoveItem(layout: SheetLayout, elementId: SheetElementId): SheetLayout {
	let rowIndex;
	let cellIndex;

	for (let i = 0; i < layout.length; i++) {
		const row = layout[i];
		const foundCellIndex = row.findIndex(item => item?.elementId === elementId);

		if (foundCellIndex !== -1) {
			rowIndex = i;
			cellIndex = foundCellIndex;
			break;
		}
	}

	if (rowIndex === undefined) {
		return layout;
	}

	const newLayout = layout.slice();
	const newRow = layout[rowIndex]!.slice();

	newRow[cellIndex!] = null;

	const lastNonEmptyCellIndex = newRow.findLastIndex(item => item !== null);

	newRow.length = lastNonEmptyCellIndex + 1;

	if (newRow.length === 0) {
		newLayout.splice(rowIndex, 1);
	}
	else {
		newLayout[rowIndex] = newRow;
	}
	
	return newLayout;
}

function layoutInsertItem(
	layout: SheetLayout,
	rowIndex: number,
	cellIndex: 0 | 1,
	item: SheetLayoutItem
): SheetLayout {
	if (cellIndex === 1 && item.colSpan === 2) {
		return layout;
	}

	const newLayout = layout.slice();
	const previousRow = layout[rowIndex];
	const shouldInsertNewRow = (
		!previousRow ||
		previousRow[0]?.colSpan === 2 ||
		(previousRow.length === 2 && previousRow.every(item => item !== null)) ||
		(item.colSpan === 2 && previousRow.some(cell => cell !== null))
	);

	if (shouldInsertNewRow) {
		const newRow = (cellIndex === 0 || item.colSpan === 2) ? [item] : [null, item];

		newLayout.splice(rowIndex, 0, newRow);

		return newLayout;
	}

	const newRow = previousRow.slice();
	const previousCell = previousRow[cellIndex];
	const otherCellIndex = 1 - cellIndex;
	const otherCell = previousRow[otherCellIndex];

	if (!previousCell) {
		newRow[cellIndex] = item;
	}
	else if (!otherCell) {
		newRow[otherCellIndex] = previousCell;
		newRow[cellIndex] = item;
	}
	else {
		console.error('Shouldnt reach!', layout, rowIndex, cellIndex, item);
	}

	newLayout[rowIndex] = newRow;

	return newLayout;
}

function createContentSizeObserver(
	element: () => HTMLElement,
	observeOptions?: ResizeObserverOptions
): Accessor<{ width: number, height: number }> {
	const [size, setSize] = createSignal({ width: 0, height: 0 });
	const observer = new ResizeObserver(([entry]) => {
		let size;

		if (observeOptions?.box === 'border-box') {
			size = entry.borderBoxSize[0];
		}
		else {
			size = entry.contentBoxSize[0];
		}

		setSize({ width: size.inlineSize, height: size.blockSize });
	});

	createEffect(() => {
		const el = element();

		if (!el) {
			return;
		}

		observer.observe(el, observeOptions);

		onCleanup(() => observer.unobserve(el));
	});

	return size;
}

const longPressTimeMs = 400;

type DraggedState = {
	elementId: SheetElementId | null;
	elementOffsetX: number;
	elementOffsetY: number;
	mouseX: number;
	mouseY: number;
};

export default function LayoutRoute() {
	const navigate = useNavigate();
	const [sheet, setSheet] = useSheet();
	const [dragged, setDragged] = createStore<DraggedState>({
		elementId: null,
		elementOffsetX: 0,
		elementOffsetY: 0,
		mouseX: 0,
		mouseY: 0,
	});
	let layoutRef!: HTMLDivElement;
	let [dummyRowRef, setDummyRowRef] = createSignal<HTMLDivElement>();
	let [dummyCellRef, setDummyCellRef] = createSignal<HTMLDivElement>();
	const rowSize = createContentSizeObserver(() => dummyRowRef()!, { box: 'border-box' });
	const cellSize = createContentSizeObserver(() => dummyCellRef()!, { box: 'border-box' });
	const isDragging = () => dragged.elementId !== null;
	let longPressTimeout: NodeJS.Timeout | null;

	const hoveredRowIndex = createMemo(() => {
		if (!isDragging() || !layoutRef) {
			return null;
		}
		
		const rowHeight = rowSize().height;
		
		if (rowHeight === 0) {
			return null;
		}
		
		const index = Math.floor((dragged.mouseY - layoutRef.offsetTop) / rowHeight);
		
		if (index < 0) {
			return null;
		}

		if (index > sheet.layout.length) {
			return sheet.layout.length;
		}

		return index;
	});

	const hoveredRowHorizontal = createMemo(() => {
		const rowRef = dummyRowRef();

		if (!isDragging() || !rowRef) {
			return null;
		}

		const rowWidth = rowSize().width;

		if (rowWidth === 0) {
			return null;
		}

		const horizontal = (dragged.mouseX - rowRef.offsetLeft) / rowWidth;

		if (horizontal < 0 || horizontal > 1) {
			return null;
		}

		return horizontal;
	});

	const hoveredCellIndex = createMemo(() => {
		const horizontal = hoveredRowHorizontal();

		if (horizontal === null) {
			return null;
		}

		if (horizontal < 2 / 3) {
			return 0;
		}
		else {
			return 1;
		}
	});

	const hoveredCellColSpan = createMemo(() => {
		const horizontal = hoveredRowHorizontal();
		
		if (horizontal === null) {
			return null;
		}
		
		if (horizontal > 1 / 3 && horizontal < 2 / 3) {
			return 2;
		}
		else {
			return 1;
		}
	});
	
	const projectedLayout = createMemo(() => {
		if (!isDragging()) {
			return sheet.layout;
		}

		const elementId = dragged.elementId!;
		const newRowIndex = hoveredRowIndex();
		const newCellIndex = hoveredCellIndex();
		const colSpan = hoveredCellColSpan();

		if (newRowIndex === null || newCellIndex === null || colSpan === null) {
			return sheet.layout;
		}

		let newLayout = sheet.layout;

		newLayout = layoutRemoveItem(newLayout, elementId);
		newLayout = layoutInsertItem(newLayout, newRowIndex, newCellIndex, { elementId, colSpan });

		return newLayout;
	});

	const onDrop = () => {
		setSheet('layout', projectedLayout());
	}

	onMount(() => {
		const onPointerMove = (event: PointerEvent) => {
			if (!dragged.elementId) {
				return;
			}
	
			setDragged({
				mouseX: event.pageX,
				mouseY: event.pageY,
			});
		}

		const onPointerUp = () => {
			if (isDragging()) {
				batch(() => {
					onDrop();
					setDragged('elementId', null);
				});
			}
		}

		const onTouchMove = (event: TouchEvent) => {
			if (isDragging()) {
				event.preventDefault();
			}
		};
		
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('touchmove', onTouchMove, { passive: false });
		
		onCleanup(() => {
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('touchmove', onTouchMove);
		});
	});

	const onLongPress = (event: PointerEvent) => {
		const target = event.currentTarget as HTMLElement;
		const elementId = target.dataset.elementId ?? null;

		setDragged('elementId', elementId);
	}

	const startLongPress = (event: PointerEvent) => {
		event.preventDefault();
		event.stopPropagation();
		
		longPressTimeout = setTimeout(() => {
			longPressTimeout = null;
			onLongPress(event);
		}, longPressTimeMs);
		
		onPointerMove(event);
	}
	
	const onPointerMove = (event: PointerEvent) => {
		if (!longPressTimeout) {
			return;
		}

		event.preventDefault();

		const target = event.currentTarget as HTMLElement;

		setDragged({
			elementOffsetX: event.pageX - target.offsetLeft,
			elementOffsetY: event.pageY - target.offsetTop,
			mouseX: event.pageX,
			mouseY: event.pageY,
		});
	}

	const cancelLongPress = () => {
		if (longPressTimeout === null) {
			return;
		}

		clearTimeout(longPressTimeout);
		longPressTimeout = null;
	}

	return (
		<>
			<PageSection>
				<Button onClick={() => navigate('/elements/edit')}>+ Add Element</Button>
			</PageSection>
			<PageSection grow>
				<div
					ref={layoutRef}
					class={styles.layout}
					classList={{ [styles.dragging]: isDragging() }}
				>
					<For each={projectedLayout()}>
						{row => (
							<LayoutRow>
								<For each={row}>
									{item => (
										item === null ? (
											<LayoutCell colSpan={1} />
										) : item.elementId === dragged.elementId ? (
											<LayoutCell
												class={styles.dropPreviewCell}
												colSpan={item.colSpan}
											/>
										) : (
											<LayoutCell
												colSpan={item.colSpan}
												elementId={item.elementId}
												onPointerDown={startLongPress}
												onPointerMove={onPointerMove}
												onPointerUp={cancelLongPress}
												onPointerOut={cancelLongPress}
												onPointerCancel={cancelLongPress}
											>
												<SheetLayoutElement id={item.elementId} />
											</LayoutCell>
										)
									)}
								</For>
							</LayoutRow>
						)}
					</For>
					<LayoutRow ref={setDummyRowRef}>
						<LayoutCell ref={setDummyCellRef} colSpan={1} />
					</LayoutRow>
					<div
						class={classes(styles.draggedContainer)}
						classList={{ [styles.hide]: !isDragging() }}
						style={isDragging() ? ({
							left: (dragged.mouseX) + 'px',
							top: (dragged.mouseY) + 'px',
							transform: 'translate(-50%, -50%)',
							width: (cellSize().width * (hoveredCellColSpan() ?? 1)) + 'px',
						}) : (
							undefined
						)}
					>
						<LayoutCell colSpan={hoveredCellColSpan() ?? 1}>
							<SheetLayoutElement id={dragged.elementId} />
						</LayoutCell>
					</div>
				</div>
			</PageSection>
		</>
	);
}