import { Route, Router } from '@solidjs/router';
import { lazy } from 'solid-js';

const PlaceholderRoute = lazy(() => import('components/routes/PlaceholderRoute'));

function App() {
	return (
		<Router>
			<Route path="/element:id" component={PlaceholderRoute} />
		</Router>
	);
}

export default App;
