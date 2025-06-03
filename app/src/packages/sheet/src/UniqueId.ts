import { randomId } from 'utils/Id';
import type { Sheet } from './types';

export function uniqueId(sheet: Sheet) {
	let id;

	while (id === undefined || id in sheet.elements) {
		id = randomId();
	}

	return id;
}