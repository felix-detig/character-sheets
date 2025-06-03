import { Route, Router } from '@solidjs/router';
import ElementEditRoute from 'components/routes/ElementEditRoute';
import ElementListRoute from 'components/routes/ElementListRoute';
import PlaceholderRoute from 'components/routes/PlaceholderRoute';
import { GetterGraphProvider } from 'state/GetterGraph';
import { SheetProvider } from 'state/Sheet';
import { GetterGraph } from 'getter-graph';
import type { SheetValueId, Sheet } from 'sheet';
import { createSignal } from 'solid-js';
import LayoutRoute from 'components/routes/LayoutRoute';
import ErrorRoute from 'components/routes/ErrorRoute';
import TestRoute from 'components/routes/TestRoute';

const sheetPlaceholder: Sheet = {
	title: 'Placeholder',
	version: 0,
	values: {},
	layout: [],
};

export default function App() {
	const [graph] = createSignal(new GetterGraph<SheetValueId, number | boolean>());

	return (
		<SheetProvider data={sheetPlaceholder}>
			<GetterGraphProvider value={graph}>
				<Router>
					<Route path="/" component={PlaceholderRoute} />
					<Route path="/elements">
						<Route path="/list" component={ElementListRoute} />
						<Route path="/edit/:id?" component={ElementEditRoute} />
					</Route>
					<Route path="/layout" component={LayoutRoute} />
					<Route path="/test" component={TestRoute} />
					<Route path="*" component={ErrorRoute} />
				</Router>
			</GetterGraphProvider>
		</SheetProvider>
	);
}
