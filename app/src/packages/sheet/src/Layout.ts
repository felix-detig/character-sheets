import type { SheetLayout, SheetLayoutItem } from './types';


/**
 * If the passed callback is never satisfied, the returned values point to the first point after the layouts end. 
 */
export function find(
	layout: SheetLayout,
	callback: (item: SheetLayoutItem | null, index: number, row: number, col: number) => boolean
): [index: number, row: number, col: number] {
	let index = 0;
	let row = 0;
	let col = 0;

	findLocation: for (; index < layout.length; index++) {
		const item = layout[index];
		const colStart = col;
		const colSpan = item?.colSpan ?? 1;

		for (let itemCol = colStart; itemCol < colStart + colSpan; itemCol++) {
			if (callback(layout[index], index, row, col)) {
				break findLocation;
			}
			
			col += 1;
	
			if (col > 1) {
				row += 1;
				col = 0;
			}
		}
	}

	return [index, row, col];
}

export function removeItem(layout: SheetLayout, item: SheetLayoutItem): SheetLayout {
	const [index, , col] = find(layout, i => i === item);

	if (index === layout.length) {
		return layout;
	}

	const newLayout = layout.slice();

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

export function removeItemUnclean(layout: SheetLayout, item: SheetLayoutItem): SheetLayout {
	const index = layout.findIndex(i => i === item);

	if (index === -1) {
		return layout;
	}

	const newLayout = layout.slice();

	newLayout[index] = null;

	return newLayout;
}

export function insertItem(
	layout: SheetLayout,
	row: number,
	col: 0 | 1,
	item: SheetLayoutItem
): SheetLayout {
	if (col === 1 && item.colSpan === 2) {
		console.error('Tried inserting item outside of layout bounds!', item);

		return layout;
	}
	
	let [index, , foundCol] = find(layout, (_, __, r, c) => row === r && col === c);
	const newLayout = layout.slice();

	// item insertion past end of layout, right column
	if (foundCol !== col) {
		index += 1;
	}

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

export function cleanup(layout: SheetLayout): SheetLayout {
	const newLayout: SheetLayout = [];
	
	for (let i = 0; i < layout.length; i++) {
		if (layout[i]?.colSpan === 2) {
			newLayout.push(layout[i]);
			continue;
		}
		
		if (layout[i] || layout[i + 1]) {
			newLayout.push(layout[i], layout[i + 1] ?? null);
		}
		
		i++;
	}

	return newLayout.length === layout.length ? layout : newLayout;
}