// TODO: add timestamp or put that in metadata file (google docs hidden app files?)
/**
 * `JSON.stringify`able definition of all sheet data.
 */
export type Sheet = {
	title: string;
	version: 0;
	elements: { [id: SheetElementId]: SheetElement };
	layout: SheetLayout;
};

export type SheetLayout = (null | SheetLayoutItem)[];

export type SheetLayoutItem = SheetLayoutItemDropPreview | SheetLayoutItemElement;

export type SheetLayoutItemElement = SheetLayoutItemBase & {
	type: 'element';
	elementId: SheetElementId;
}

export type SheetLayoutItemDropPreview = SheetLayoutItemBase & {
	type: 'preview';
}

type SheetLayoutItemBase = {
	colSpan: 1 | 2;
}

export type SheetElement = SheetElementNumber | SheetElementBoolean | SheetElementAction;

export type SheetElementNumber = SheetElementValueBase & {
	[K in keyof SheetElementDefinitions['number']]: SheetElementFunctionValueBase<'number'> & {
		definition: { type: K } & SheetElementDefinitions['number'][K];
	}
}[keyof SheetElementDefinitions['number']];

export type SheetElementBoolean = SheetElementValueBase & {
	[K in keyof SheetElementDefinitions['boolean']]: SheetElementFunctionValueBase<'boolean'> & {
		definition: { type: K } & SheetElementDefinitions['boolean'][K];
	}
}[keyof SheetElementDefinitions['boolean']];

export type SheetElementAction = SheetElementBase<'action'> & {
	definition: SheetElementDefinitions['action'];
};

type SheetElementFunctionValueBase<T extends string> = SheetElementBase<T> & {
	functionId?: string;
}

type SheetElementValueBase = {
	reference: string;
}

type SheetElementBase<T extends string> = {
	id: SheetElementId;
	title: string;
	description: string;
	type: T;
};

export type SheetElementId = string;

export type SheetElementDefinitions = {
	number: {
		function: FunctionDefinition;
		variable: NumberVariableDefinition;
	};
	boolean: {
		function: FunctionDefinition;
		variable: BooleanVariableDefinition;
	};
	action: ActionDefinition;
};

export type NumberVariableDefinition = {
	value: number;
	min?: string;
	max?: string;
}

export type BooleanVariableDefinition = {
	value: boolean;
}

export type FunctionDefinition = {
	body: string;
};

export type ActionDefinition = {};