// TODO: add timestamp or put that in metadata file (google docs hidden app files?)
/**
 * `JSON.stringify`able definition of all sheet data.
 */
export type Sheet = {
	title: string;
	version: 0;
	values: { [id: SheetValueId]: SheetValue };
	layout: SheetLayout;
};

export type SheetLayout = (null | SheetLayoutItem)[];

export type SheetLayoutItem = SheetLayoutItemDropPreview | SheetLayoutItemValue;

export type SheetLayoutItemValue = SheetLayoutItemBase & {
	type: 'value';
	valueId: SheetValueId;
}

export type SheetLayoutItemDropPreview = SheetLayoutItemBase & {
	type: 'preview';
}

type SheetLayoutItemBase = {
	colSpan: 1 | 2;
}

export type SheetValue = {
	[T in keyof SheetValueDefinitions]: {
		[D in keyof SheetValueDefinitions[T]]: SheetValueOf<T, D>;
	}[keyof SheetValueDefinitions[T]];
}[keyof SheetValueDefinitions];

export type SheetValueOf<
	T extends keyof SheetValueDefinitions,
	D extends keyof SheetValueDefinitions[T]
> = {
	id: SheetElementId;
	title: string;
	description: string;
	type: T;
	definitionType: D;
	definition: SheetValueDefinitions[T][D];
}

export type SheetValueId = string;

export type SheetValueDefinitions = {
	number: {
		function: FunctionDefinition;
		variable: NumberVariableDefinition;
	};
	boolean: {
		function: FunctionDefinition;
		variable: BooleanVariableDefinition;
	};
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