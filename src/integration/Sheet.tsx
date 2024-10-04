import { SheetRaw } from 'packages/sheet/src';
import { createContext, createEffect, ParentProps, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

type SheetContextValue = ReturnType<typeof createStore<SheetRaw>>;

const SheetContext = createContext<SheetContextValue>();

export type SheetProviderProps = ParentProps & { data: SheetRaw };

export function SheetProvider(props: SheetProviderProps) {
	const [sheet, setSheet] = createStore<SheetRaw>(props.data);

	createEffect(() => {
		setSheet(props.data);
	});

	return (
		<SheetContext.Provider value={[sheet, setSheet]}>
			{props.children}
		</SheetContext.Provider>
	);
}

export function useSheet(): SheetContextValue {
	const value = useContext(SheetContext);

	if (!value) {
		throw new Error('Missing sheet or used outside of context!');
	}

	return value;
}