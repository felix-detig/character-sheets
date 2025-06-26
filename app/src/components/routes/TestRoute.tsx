import PageSection from 'components/containers/PageSection';
import UserFunctionInput from 'components/user-function/UserFunctionInput';
import { createSignal } from 'solid-js';

export default function TestRoute() {
	const [value, setValue] = createSignal('');

	return (
		<PageSection scroll>
			<UserFunctionInput placeholder="Test..." value={value()} onInput={setValue} />
		</PageSection>
	);
}