import Dispatcher, { Listener } from './Dispatcher';
import { SheetRaw, SheetElement, SheetElementId } from './types';

type SheetElementListener = Listener<SheetElementId, SheetElement | undefined>

/**
 * Thin abstraction over the raw / `JSON.stringify`able sheet data.
 */
export default class Sheet {

	#raw: SheetRaw;
	#dispatcher = new Dispatcher<SheetElementId, SheetElement | undefined>

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

		this.#dispatcher.dispatch(data.id, data);
	}

	getElement(id: SheetElementId): SheetElement | undefined {
		return this.#raw.elements[id];
	}

	removeElement(id: SheetElementId) {
		if (!(id in this.#raw.elements)) {
			return false;
		}
		
		delete this.#raw.elements[id];

		this.#dispatcher.dispatch(id, undefined);
	}

	on(id: SheetElementId, listener: SheetElementListener) {
		return this.#dispatcher.on(id, listener);
	}

	off(id: SheetElementId, listener: SheetElementListener): boolean {
		return this.#dispatcher.off(id, listener);
	}

}