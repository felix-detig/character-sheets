import type { Sheet } from 'sheet';
import type { ParentProps} from 'solid-js';
import { createContext, createEffect, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

type SheetContextValue = ReturnType<typeof createStore<Sheet>>;

const SheetContext = createContext<SheetContextValue>();

export type SheetProviderProps = ParentProps & { data: Sheet };

export function SheetProvider(props: SheetProviderProps) {
	// eslint-disable-next-line solid/reactivity
	const [sheet, setSheet] = createStore(props.data);

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