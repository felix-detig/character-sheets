import PageSection from 'components/containers/PageSection';
import CodeInput from 'components/elements/inputs/CodeInput';
import UserFunctionCode from 'components/user-function/UserFunctionCode';
import { createSignal } from 'solid-js';

export default function TestRoute() {
	const [value, setValue] = createSignal('');

	return (
		<PageSection>
			<CodeInput placeholder="Test..." onInput={code => setValue(code)}>
				<UserFunctionCode value={value()} />
			</CodeInput>
		</PageSection>
	);
}