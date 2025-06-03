import type { Accessor, JSX } from 'solid-js';
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
import { createStore, unwrap } from 'solid-js/store';
import { classes } from 'utils/Css';
import PageSection from 'components/containers/PageSection';
import { useSheet } from 'state/Sheet';
import SheetLayoutElement from 'components/sheet-elements/SheetLayoutElement';
import Button from 'components/elements/Button';
import { useNavigate } from '@solidjs/router';

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
	let index = 0;
	let col = 0;

	for (; index < layout.length; index++) {
		const item = layout[index];

		if (item && item.elementId === elementId) {
			break;
		}
		
		col += layout[index]?.colSpan ?? 1;

		if (col > 1) {
			col = 0;
		}
	}

	if (index === layout.length) {
		return layout;
	}

	const newLayout = layout.slice();
	const item = layout[index];

	newLayout[index] = null;

	if (item) {
		if (item.colSpan === 1) {
			const neighborIndex = col === 0 ? index + 1 : index - 1;
			const neighborItem = newLayout[neighborIndex];
	
			if (!neighborItem) {
				newLayout.splice(Math.min(index, neighborIndex), 2);
			}
		}
		else {
			newLayout.splice(index, 1);
		}
	}

	return newLayout;
}

function layoutInsertItem(
	layout: SheetLayout,
	row: number,
	col: 0 | 1,
	item: SheetLayoutItem
): SheetLayout {
	if (col === 1 && item.colSpan === 2) {
		console.error(`Tried inserting item ${item.elementId} outside of layout bounds!`);

		return layout;
	}

	let index = 0;
	let currentRow = 0;
	let currentCol = 0;

	findLocation: for (; index < layout.length; index++) {
		const item = layout[index];
		const colStart = currentCol;
		const colSpan = item?.colSpan ?? 1;

		for (let itemCol = colStart; itemCol < colStart + colSpan; itemCol++) {
			if (currentRow === row && currentCol === col) {
				break findLocation;
			}
			
			currentCol += 1;
	
			if (currentCol > 1) {
				currentRow += 1;
				currentCol = 0;
			}
		}
	}
	
	const newLayout = layout.slice();

	// item insertion past end of layout, right column
	if (currentCol !== col) {
		index += 1;
	}

	console.log('found target', currentRow, currentCol, index);

	if (item.colSpan === 2) {
		newLayout.splice(index, 0, item);

		return newLayout;
	}

	const previousItem = layout[index];

	if (previousItem?.colSpan === 2) {
		const newRow = col === 0 ? [item, null] : [null, item];

		newLayout.splice(index, 0, ...newRow);

		return newLayout;
	}

	const neighborIndex = col === 0 ? index + 1 : index - 1;
	const neighborItem = layout[neighborIndex];
	
	if (!previousItem) {
		newLayout[index] = item;

		if (neighborItem === undefined) {
			newLayout[neighborIndex] = null;
		}
	}
	else if (!neighborItem) {
		newLayout[index] = item;
		newLayout[neighborIndex] = previousItem;
	}
	else {
		const newRow = col === 0 ? [item, null] : [null, item];

		newLayout.splice(index, 0, ...newRow);
	}
	
	return newLayout;
}

function createSizeObserver(
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

function animatePosition(
	element: HTMLElement,
	before: DOMRect,
	after: DOMRect
) {
	const dX = before.x - after.x;
	const dY = before.y - after.y;

	if (dX === 0 && dY === 0) {
		return;
	}

	element.style.transition = 'none';
	element.style.transform = `translate(${dX}px, ${dY}px)`;

	void element.getBoundingClientRect();

	requestAnimationFrame(() => {
		element.style.transition = '';
		element.style.transform = '';
	});
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
	let [layoutRef, setLayoutRef] = createSignal<HTMLDivElement>();
	const [dummyCellRef, setDummyCellRef] = createSignal<HTMLDivElement>();
	const layoutSize = createSizeObserver(() => layoutRef()!, { box: 'content-box' });
	const cellSize = createSizeObserver(() => dummyCellRef()!, { box: 'border-box' });
	const isDragging = () => dragged.elementId !== null;
	let longPressTimeout: NodeJS.Timeout | null;
	const animatedCellRefs = new Map<SheetElementId, HTMLDivElement>();

	const hoveredRow = createMemo(() => {
		const layoutElement = layoutRef();

		if (!isDragging() || !layoutElement) {
			return null;
		}
		
		const rowHeight = cellSize().height;
		
		if (rowHeight === 0) {
			return null;
		}
		
		const index = Math.floor((dragged.mouseY - layoutElement.offsetTop) / rowHeight);
		
		if (index < 0) {
			return null;
		}

		if (index > sheet.layout.length) {
			return sheet.layout.length;
		}

		return index;
	});

	const hoveredRowHorizontal = createMemo(() => {
		const layoutElement = layoutRef();

		if (!isDragging() || !layoutElement) {
			return null;
		}

		const rowWidth = layoutSize().width;

		if (rowWidth === 0) {
			return null;
		}

		const horizontal = (dragged.mouseX - layoutElement.offsetLeft) / rowWidth;

		if (horizontal < 0 || horizontal > 1) {
			return null;
		}

		return horizontal;
	});

	const hoveredCol = createMemo(() => {
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

	const hoveredColSpan = createMemo(() => {
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
		const newRow = hoveredRow();
		const newCol = hoveredCol();
		const colSpan = hoveredColSpan();

		if (newRow === null || newCol === null || colSpan === null) {
			return sheet.layout;
		}

		const beforeRects = new Map<SheetElementId, DOMRect>();

		for (const [id, element] of animatedCellRefs.entries()) {
			beforeRects.set(id, element.getBoundingClientRect());
		}

		let newLayout = unwrap(sheet.layout);


		newLayout = layoutRemoveItem(newLayout, elementId);
		newLayout = layoutInsertItem(newLayout, newRow, newCol, { elementId, colSpan });

		queueMicrotask(() => {
			for (const [id, before] of beforeRects.entries()) {
				const element = animatedCellRefs.get(id);
	
				if (!element) {
					continue;
				}
	
				const after = element.getBoundingClientRect();
	
				animatePosition(element, before, after);
			}
		});

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
		window.addEventListener('touchmove', onTouchMove);
		
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

	createEffect(() => projectedLayout() && console.log(projectedLayout()));

	const draggedItemWidth = () => hoveredColSpan() === 2 ? layoutSize().width : cellSize().width;

	return (
		<>
			<PageSection>
				<Button onClick={() => navigate('/elements/edit')}>+ Add Element</Button>
			</PageSection>
			<PageSection grow>
				<div
					ref={setLayoutRef}
					class={styles.layout}
					classList={{ [styles.dragging]: isDragging() }}
				>
					<For each={projectedLayout()}>
						{item => {
							if (item === null) {
								return (
									<LayoutCell colSpan={1} />
								);
							}
							else if (!item) {
								console.log('unknown item', item)
							}
							else if (item.elementId === dragged.elementId) {
								return (
									<LayoutCell colSpan={item.colSpan}>
										<div class={styles.dropPreviewItem} />
									</LayoutCell>
								);
							}
							else {
								let ref!: HTMLDivElement;

								onMount(() => animatedCellRefs.set(item.elementId, ref));
								onCleanup(() => animatedCellRefs.delete(item.elementId));

								return (
									<LayoutCell
										ref={ref}
										class={styles.transitionTransform}
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
								);
							}
						}}
					</For>
					<LayoutCell class={styles.dummyCell} ref={setDummyCellRef} colSpan={1} />
					<div
						class={classes(styles.draggedCellContainer)}
						classList={{ [styles.hide]: !isDragging() }}
						style={isDragging() ? ({
							left: (dragged.mouseX) + 'px',
							top: (dragged.mouseY) + 'px',
							transform: 'translate(-50%, -50%)',
							width: draggedItemWidth() + 'px',
						}) : (
							undefined
						)}
					>
						<LayoutCell colSpan={hoveredColSpan() ?? 1}>
							<div class={styles.draggedItemContainer}>
								<SheetLayoutElement id={dragged.elementId} />
							</div>
						</LayoutCell>
					</div>
				</div>
			</PageSection>
		</>
	);
}