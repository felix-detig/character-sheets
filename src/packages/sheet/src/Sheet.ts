import { SheetRaw, SheetElement, SheetElementId } from './types';

/**
 * Thin abstraction over the raw / `JSON.stringify`able sheet data.
 */
export default class Sheet {

	#raw: SheetRaw;

	get title() {
		return this.#raw.title;
	}

	set title(newTitle: string) {
		this.#raw.title = newTitle;
	}

	constructor(data?: SheetRaw) {
		// TODO: validation
		// TODO: data version update

		this.#raw = data ?? {
			title: '',
			elements: {},
		};
	}

	raw(): Readonly<SheetRaw> {
		return this.#raw;
	}

	setElement(data: SheetElement) {
		this.#raw.elements[data.id] = data;
	}

	removeElement(id: SheetElementId) {
		delete this.#raw.elements[id];
	}

}