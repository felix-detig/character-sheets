import { createEffect, createRenderEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate, useParams } from '@solidjs/router';
import { useSheet } from 'integration/Sheet';
import { SheetElement } from 'packages/sheet/src';
import { DeepPartial } from 'types/Utility';
import TextInput from 'components/elements/inputs/TextInput';
import { useGetterGraph } from 'integration/GetterGraph';
import { interpret } from 'packages/user-functions/src';
import TextAreaInput from 'components/elements/inputs/TextAreaInput';

export default function ElementEditRoute() {
	const params = useParams<{ id?: string }>();
	const navigate = useNavigate();
	const id = () => params.id;
	const [sheet, setSheet] = useSheet();
	const graph = useGetterGraph();
	const [formData, setFormData] = createStore<DeepPartial<SheetElement>>();
	
	createRenderEffect(() => {
		const idV = id();

		if (idV) {
			setFormData(sheet.elements[idV] ?? {});
		}
		else {
			setFormData({});
		}
	});

	const onSubmit = () => {
		if (!formData.id) {
			throw new Error('Undefined id!');
		}

		const prevId = id();
		const definition = formData.definition ?? '';

		setSheet('elements', formData.id, {
			id: formData.id,
			title: formData.id,
			description: '',
			type: 'number',
			definition,
		});

		graph().set(formData.id, context => interpret(definition, context));

		if (prevId !== undefined && prevId !== formData.id) {
			graph().delete(prevId);
		}

		console.log('errors:');
		graph().getErrors(formData.id).forEach(error => console.error(error));

		navigate(-1);
	}

	return (
		<div style={{ 'display': 'flex', 'flex-direction': 'column' }}>
			<TextInput value={formData.id ?? ''} onInput={value => setFormData('id', value)} />
			<TextAreaInput
				value={formData.definition ?? ''}
				onInput={value => setFormData('definition', value)}
			/>
			<button onClick={onSubmit}>save</button>
		</div>
	);
}