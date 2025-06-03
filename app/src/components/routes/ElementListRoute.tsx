import { A } from '@solidjs/router';
import { useGetterGraph, useGetterValue } from 'state/GetterGraph';
import { useSheet } from 'state/Sheet';
import { For } from 'solid-js';
import { unwrap } from 'solid-js/store';
import Button from 'components/elements/Button';
import { IconWith } from 'components/containers/IconWith';
import { OcPlus2 } from 'solid-icons/oc';
import PageSection from 'components/containers/PageSection';

export default function ElementListRoute() {
	const [sheet] = useSheet();
	const graph = useGetterGraph();
	const sortedElements = () => {
		const elements = Object.values(sheet.elements);

		elements.sort((a, b) => {
			if (a.title < b.title) {
				return -1;
			}
			else if (a.title > b.title) {
				return 1;
			}
			else {
				return 0;
			}
		});

		return elements;
	}
	
	return (
		<PageSection>
			<For each={sortedElements()}>
				{element => {
					const value = useGetterValue(() => element.id);

					return (
						<A
							href={`/elements/edit/${element.id}`}
							style={{ 'display': 'flex', 'justify-content': 'space-between' }}
						>
							<span>{element.title}</span>
							<span>{value()}</span>
						</A>
					);
				}}
			</For>
			<Button component={A} href="/elements/edit">
				<IconWith icon={<OcPlus2 />}>
					New
				</IconWith>
			</Button>
			<Button onClick={() => console.log(unwrap(sheet))}>print sheet</Button>
			<Button onClick={() => console.log(graph())}>print graph</Button>
		</PageSection>
	);
}