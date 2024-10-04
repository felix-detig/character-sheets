import { GetterGraph } from 'packages/getter-graph/src';
import { SheetElementId } from 'packages/sheet/src';
import {
	Accessor,
	createComputed,
	createContext,
	createSignal,
	onCleanup,
	useContext
} from 'solid-js';

const GetterGraphContext = createContext<Accessor<GetterGraph<SheetElementId, number | boolean>>>();

export const GetterGraphProvider = GetterGraphContext.Provider;

export function useGetterGraph(): Accessor<GetterGraph<SheetElementId, number | boolean>> {
	const value = useContext(GetterGraphContext);

	if (!value) {
		throw new Error('Missing GetterGraph in context!');
	}

	return value;
}

export function useGetterValue(
	id: Accessor<SheetElementId>
): Accessor<number | boolean | undefined> {
	const graph = useGetterGraph();
	const [value, setValue] = createSignal<number | boolean | undefined>();

	createComputed(() => {
		const graphV = graph();

		if (!graphV) {
			setValue(undefined);
			return;
		}

		const idV = id();

		setValue(graphV.get(idV));

		graphV.on(idV, setValue);

		onCleanup(() => {
			graphV.off(idV, setValue);
		});
	});

	return value;
}