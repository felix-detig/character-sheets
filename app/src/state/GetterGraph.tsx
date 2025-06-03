import type { GetterGraph } from 'getter-graph';
import type { SheetValueId } from 'sheet';
import type { Accessor } from 'solid-js';
import {
	createComputed,
	createContext,
	createSignal,
	onCleanup,
	useContext
} from 'solid-js';
import type { UserFunctionValue } from 'user-function';

type GetterGraphContextValue = Accessor<GetterGraph<SheetValueId, UserFunctionValue>>;

const GetterGraphContext = createContext<GetterGraphContextValue>();

export const GetterGraphProvider = GetterGraphContext.Provider;

export function useGetterGraph(): GetterGraphContextValue {
	const value = useContext(GetterGraphContext);

	if (!value) {
		throw new Error('Outside of GetterGraphProvider or no GetterGraph is set!');
	}

	return value;
}

export function useGetterValue(
	id: Accessor<SheetValueId | null | undefined>
): Accessor<UserFunctionValue | undefined> {
	const graph = useGetterGraph();
	const [value, setValue] = createSignal<UserFunctionValue | undefined>();

	createComputed(() => {
		const graphV = graph();

		if (!graphV) {
			setValue(undefined);
			return;
		}

		const idV = id();

		if (!idV) {
			setValue(undefined);
			return;
		}

		setValue(graphV.get(idV));

		graphV.on(idV, setValue);

		onCleanup(() => {
			graphV.off(idV, setValue);
		});
	});

	return value;
}