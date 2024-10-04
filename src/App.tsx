import { Route, Router } from '@solidjs/router';
import ElementEditRoute from 'components/routes/ElementEditRoute';
import ElementListRoute from 'components/routes/ElementList';
import PlaceholderRoute from 'components/routes/PlaceholderRoute';
import { GetterGraphProvider } from 'integration/GetterGraph';
import { SheetProvider } from 'integration/Sheet';
import { GetterGraph } from 'packages/getter-graph/src';
import { SheetElementId, SheetRaw } from 'packages/sheet/src';
import { createSignal } from 'solid-js';

const sheetPlaceholder: SheetRaw = {
	title: 'Placeholder',
	elements: {},
};

function App() {
	const [graph] = createSignal(new GetterGraph<SheetElementId, number | boolean>());

	return (
		<SheetProvider data={sheetPlaceholder}>
			<GetterGraphProvider value={graph}>
				<Router>
					<Route path="/" component={PlaceholderRoute} />
					<Route path="/elements">
						<Route path="/list" component={ElementListRoute} />
						<Route path="/edit/:id?" component={ElementEditRoute} />
					</Route>
				</Router>
			</GetterGraphProvider>
		</SheetProvider>
	);
}

export default App;
