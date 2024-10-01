// TODO: add timestamp or put that in metadata file (google docs hidden app files?)
/**
 * `JSON.stringify`able definition of all sheet data.
 */
export type SheetRaw = {
	title: string;
	elements: { [id: string]: SheetElement };
}

export type SheetElementId = string;

export type SheetElement = {
	[K in keyof SheetElementDefinitions]: SheetElementBase<K>;
}[keyof SheetElementDefinitions];

type SheetElementBase<
	T extends keyof SheetElementDefinitions = keyof SheetElementDefinitions
> = {
	id: string;
	title: string;
	description: string;
	type: T;
	definition: SheetElementDefinitions[T];
}

export type SheetElementDefinitions = {
	number: NumberDefinition;
	boolean: BooleanDefinition;
	// action: ActionDefinition;
};

export type NumberDefinition = string;
export type BooleanDefinition = string;
export type ActionDefinition = {};
