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
import { Layout, type SheetLayoutItem } from 'sheet';
import { createStore, unwrap } from 'solid-js/store';
import { classes } from 'utils/Css';
import PageSection from 'components/containers/PageSection';
import { useSheet } from 'state/Sheet';
import Button from 'components/elements/Button';
import { useNavigate } from '@solidjs/router';
import LayoutItem from 'components/layout/LayoutItem';

function LayoutCell(props: JSX.IntrinsicElements['div'] & { colSpan: number }) {
	const [propsOwn, propsRest] = splitProps(props, ['class', 'colSpan', 'ref', 'children']);

	return (
		<div
			ref={propsOwn.ref}
			class={classes(propsOwn.class, styles.cell)}
			style={{ 'grid-column-end': 'span ' + props.colSpan }}
			{...propsRest}
		>
			{props.children}
			<div class={styles.cellOverlay} />
		</div>
	);
}

function createSizeObserver(
	element: () => HTMLElement,
	observeOptions?: ResizeObserverOptions
): Accessor<{ width: number, height: number }> {
	const [size, setSize] = createSignal({ width: 0, height: 0 });
	const observer = new ResizeObserver(([entry]) => {
		let newSize;

		if (observeOptions?.box === 'border-box') {
			newSize = entry.borderBoxSize[0];
		}
		else {
			newSize = entry.contentBoxSize[0];
		}

		const { width, height } = size();
		const newWidth = newSize.inlineSize;
		const newHeight = newSize.blockSize;

		if (newWidth !== width || newHeight === height) {
			setSize({ width: newWidth, height: newHeight });
		}
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

	requestAnimationFrame(() => {
		element.style.transition = '';
		element.style.transform = '';
	});
}

const longPressTimeMs = 400;

type DraggedState = {
	item: SheetLayoutItem | null;
	mouseX: number;
	mouseY: number;
};

export default function LayoutRoute() {
	const navigate = useNavigate();
	const [sheet, setSheet] = useSheet();
	const [dragged, setDragged] = createStore<DraggedState>({
		item: null,
		mouseX: 0,
		mouseY: 0,
	});
	const draggedItem = () => unwrap(dragged.item);
	const [layoutRef, setLayoutRef] = createSignal<HTMLDivElement>();
	const [dummyCellRef, setDummyCellRef] = createSignal<HTMLDivElement>();
	const layoutSize = createSizeObserver(() => layoutRef()!, { box: 'content-box' });
	const cellSize = createSizeObserver(() => dummyCellRef()!, { box: 'border-box' });
	const isDragging = () => dragged.item !== null;
	let longPressTimeout: NodeJS.Timeout | null;
	let lastDroppedItem: SheetLayoutItem | null = null;
	const animatedCellRefs = new Map<SheetLayoutItem, HTMLDivElement>();
	const animatedCellsBefore = new Map<SheetLayoutItem, DOMRect>();
	let draggedContainerRef!: HTMLDivElement;

	onMount(() => {
		const onPointerMove = (event: PointerEvent) => {
			if (isDragging()) {
				console.log('pointer move global', event.pageX, event.pageY);
				setDragged({
					mouseX: event.pageX,
					mouseY: event.pageY,
				});
			}
		}

		const onPointerLeave = () => {
			console.log('pointer leave')
			cancelDrag();
		}

		const onPointerUp = () => {
			if (isDragging()) {
				console.log('pointer up')
				batch(() => {
					onDrop();
					setDragged('item', null);
				});
			}
		}

		// const onTouchMove = (event: TouchEvent) => {
		// 	if (isDragging()) {
		// 		console.log('touch move');
		// 		event.preventDefault();
		// 	}
		// };

		const onPointerCancel = (event: PointerEvent) => {
			if (isDragging()) {
				event.preventDefault();
			}
			console.log('pointer cancel global')
		};
		
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerleave', onPointerLeave);
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointercancel', onPointerCancel);
		// window.addEventListener('touchmove', onTouchMove);
		
		onCleanup(() => {
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerleave', onPointerLeave);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', onPointerCancel);
			// window.removeEventListener('touchmove', onTouchMove);
		});
	});

	const animateCellsCaptureBefore = () => {
		for (const [item, element] of animatedCellRefs.entries()) {
			animatedCellsBefore.set(item, element.getBoundingClientRect());
		}
	}

	const animateCells = () => {
		for (const [item, before] of animatedCellsBefore.entries()) {
			const element = animatedCellRefs.get(item);

			if (!element) {
				continue;
			}

			const after = element.getBoundingClientRect();

			animatePosition(element, before, after);
		}

		animatedCellsBefore.clear();
	}

	const hoveredRow = createMemo(() => {
		const layoutElement = layoutRef();

		if (!isDragging() || !layoutElement) {
			return null;
		}
		
		const rowHeight = cellSize().height;
		
		if (rowHeight === 0) {
			return null;
		}

		const filledLayoutHeight = layoutElement.offsetHeight - rowHeight;
		const maxRow = Math.floor((filledLayoutHeight - 1) / rowHeight) + 1;
		const mouseY = dragged.mouseY - layoutElement.offsetTop;
		const mouseRow = Math.floor(mouseY / rowHeight);

		const index = Math.min(mouseRow, maxRow);
		
		if (index < 0) {
			return 0;
		}

		return index;
	});

	const hoveredRowHorizontal = createMemo(() => {
		const layoutElement = layoutRef();

		if (!isDragging() || !layoutElement) {
			return null;
		}

		const rowWidth = layoutElement.clientWidth;

		if (rowWidth === 0) {
			return null;
		}

		const horizontal = (dragged.mouseX - layoutElement.offsetLeft) / rowWidth;

		// if (horizontal < 0 || horizontal > 1) {
		// 	return null;
		// }

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
		const baseLayout = unwrap(sheet.layout);

		if (!isDragging()) {
			return baseLayout;
		}

		const item = draggedItem()!;
		const newRow = hoveredRow();
		const newCol = hoveredCol();
		const colSpan = hoveredColSpan();

		if (newRow === null || newCol === null || colSpan === null) {
			return baseLayout;
		}

		animateCellsCaptureBefore();
		
		const previewItem = baseLayout.find(item => item?.type === 'preview');
		let newLayout = baseLayout;
		
		if (previewItem) {
			newLayout = Layout.removeItemUnclean(newLayout, previewItem);
		}
		
		// TODO STILL not entirely clean, sometimes two nulls land in a row
		newLayout = Layout.removeItemUnclean(newLayout, item);
		newLayout = Layout.insertItem(newLayout, newRow, newCol, { type: 'preview', colSpan });
		newLayout = Layout.cleanup(newLayout);
		
		queueMicrotask(animateCells);

		return newLayout;
	});

	const cancelDrag = () => {
		console.log('cancel drag');
		if (isDragging()) {
			setSheet('layout', sheet.layout.slice());
		}
	}

	const onDrop = () => {
		const layout = projectedLayout();
		const index = layout.findIndex(item => item?.type === 'preview');
		const item = dragged.item;
		const colSpan = hoveredColSpan();

		if (index === -1 || !item || !colSpan) {
			cancelDrag();
			return;
		}

		const newItem: SheetLayoutItem = { ...item, colSpan };
		const newLayout = layout.slice();

		newLayout[index] = newItem;
		lastDroppedItem = newItem;

		setSheet('layout', newLayout);
	}

	const onLongPress = (item: SheetLayoutItem) => {
		console.log('long press');
		let [indexBefore] = Layout.find(sheet.layout, i => i === item);

		if (indexBefore < sheet.layout.length) {
			indexBefore = -1;
		}

		setDragged('item', item);
	}

	const startLongPress = (event: PointerEvent, item: SheetLayoutItem) => {
		console.log('start long press');
		draggedContainerRef.setPointerCapture(event.pointerId);
		event.preventDefault();
		event.stopPropagation();
		
		longPressTimeout = setTimeout(() => {
			longPressTimeout = null;
			onLongPress(item);
		}, longPressTimeMs);
		
		onPointerMove(event);
	}
	
	const onPointerMove = (event: PointerEvent) => {
		if (!longPressTimeout || isDragging()) {
			return;
		}

		console.log('pointer move local')

		event.preventDefault();

		setDragged({
			mouseX: event.pageX,
			mouseY: event.pageY,
		});
	}

	const cancelLongPress = () => {
		console.log('cancel long press');
		if (longPressTimeout === null) {
			return;
		}

		clearTimeout(longPressTimeout);
		longPressTimeout = null;
	}

	const draggedItemWidth = () => hoveredColSpan() === 2 ? layoutSize().width : cellSize().width;

	createEffect(() => projectedLayout());
	createEffect(() => console.log(isDragging()));

	return (
		<>
			<PageSection>
				<Button onClick={() => navigate('/elements/edit')}>+ Add Element</Button>
			</PageSection>
			<PageSection grow scroll classList={{ [styles.dragging]: isDragging() }}>
				<div ref={setLayoutRef} class={styles.layout}>
					<For each={projectedLayout()}>
						{item => {
							if (item === null) {
								return (
									<LayoutCell colSpan={1} />
								);
							}
							else if (item.type === 'preview') {
								return (
									<LayoutCell colSpan={item.colSpan}>
										<LayoutItem item={item} />
									</LayoutCell>
								);
							}
							else {
								let ref!: HTMLDivElement;

								onMount(() => animatedCellRefs.set(item, ref));
								onCleanup(() => animatedCellRefs.delete(item));

								const isLastDropped = lastDroppedItem === item;

								if (isLastDropped) {
									requestAnimationFrame(() => {
										ref.classList.remove(styles.dragged);
									});
								}

								return (
									<LayoutCell
										ref={ref}
										class={styles.transitionTransform}
										classList={{ [styles.dragged]: isLastDropped }}
										colSpan={item.colSpan}
										onPointerDown={event => startLongPress(event, item)}
										onPointerMove={onPointerMove}
										onPointerUp={cancelLongPress}
										onPointerOut={cancelLongPress}
										onPointerCancel={cancelLongPress}
									>
										<LayoutItem item={item} />
									</LayoutCell>
								);
							}
						}}
					</For>
					<LayoutCell class={styles.dummyCell} ref={setDummyCellRef} colSpan={1} />
					<div
						ref={draggedContainerRef}
						class={classes(styles.draggedCellContainer)}
						classList={{ [styles.hide]: !isDragging() }}
						style={isDragging() ? ({
							left: dragged.mouseX + 'px',
							top: dragged.mouseY + 'px',
							transform: 'translate(-50%, -50%)',
							width: draggedItemWidth() + 'px',
						}) : (
							undefined
						)}
					>
						<LayoutCell colSpan={hoveredColSpan() ?? 1} class={styles.dragged}>
							<div class={styles.draggedItemContainer}>
								{dragged.item && (
									<LayoutItem item={dragged.item} />
								)}
							</div>
						</LayoutCell>
					</div>
				</div>
			</PageSection>
		</>
	);
}