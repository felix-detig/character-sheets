import { A } from '@solidjs/router';
import { useGetterGraph, useGetterValue } from 'integration/GetterGraph';
import { useSheet } from 'integration/Sheet';
import { For } from 'solid-js';
import { unwrap } from 'solid-js/store';

export default function ElementListRoute() {
	const [sheet] = useSheet();
	const graph = useGetterGraph();
	
	return (
		<div style={{ 'display': 'flex', 'flex-direction': 'column' }}>
			<For each={Object.values(sheet.elements)}>
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
			<A href="/elements/edit">new</A>
			<button onClick={() => console.log(unwrap(sheet))}>print sheet</button>
			<button onClick={() => console.log(graph())}>print graph</button>
		</div>
	);
}