import { createEffect, createRenderEffect, createSignal, untrack } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate, useParams } from '@solidjs/router';
import { useSheet } from 'state/Sheet';
import type { SheetValue } from 'sheet';
import type { DeepPartial } from 'types/Utility';
import TextInput from 'components/elements/inputs/TextInput';
import { useGetterGraph } from 'state/GetterGraph';
import { interpret } from 'user-function';
import TextAreaInput from 'components/elements/inputs/TextAreaInput';
import PageSection from 'components/containers/PageSection';
import Button from 'components/elements/Button';
import SelectInput from 'components/elements/inputs/SelectInput';
import { Layout } from 'sheet';
import styles from './ElementEditRoute.module.scss';
import * as ObjectUtils from 'utils/Object';
import { BsLink45deg } from 'solid-icons/bs';
import UserFunctionInput from 'components/user-function/UserFunctionInput';

type ErrorStructure<T extends Record<any, any>, U> = {
	[K in keyof T]?: T[K] extends Record<any, any> ? ErrorStructure<T[K], U> : U;
};
type FormErrors = ErrorStructure<SheetValue, string>;

const stringToIdReduceRegex = /[^a-z0-9]+/g;

function stringToId(string: string): string {
	if (!string.length) {
		return '';
	}

	string = string.toLowerCase().replaceAll(stringToIdReduceRegex, '_');

	const firstCharCode = string.charCodeAt(0);
	const startsWithNumber = firstCharCode >= 48 && firstCharCode <= 57;

	if (startsWithNumber) {
		string = string.slice(1);
		
		if (string[0] !== '_') {
			string = '_' + string;
		}
	}

	return string;
}

export default function ElementEditRoute() {
	const params = useParams<{ id?: string }>();
	const navigate = useNavigate();
	const id = () => params.id;
	const [sheet, setSheet] = useSheet();
	const graph = useGetterGraph();
	const [form, setForm] = createStore<DeepPartial<SheetValue>>();
	const [formErrors, setFormErrors] = createSignal<FormErrors>({});
	const [hasTouchedId, setHasTouchedId] = createSignal(false);
	const definitionsByType = new Map<string, DeepPartial<SheetValue['definition']>>();

	const formReset = () => {
		const idV = id();

		if (idV === undefined) {
			setForm({});
		}
		else {
			setForm(sheet.values[idV] ?? {});
		}

		definitionsByType.clear();
		setHasTouchedId(false);
	}
		
	createRenderEffect(() => {
		formReset();
	});

	createRenderEffect(() => {
		if (!hasTouchedId()) {
			setForm('id', stringToId(form.title ?? ''));
		}
	});

	createEffect((oldKey: string | undefined) => {
		if (form.type && form.definitionType) {
			return;
		}
		
		const key = `${form.type}-${form.definitionType}`;
		const definition = untrack(() => form.definition);

		if (oldKey && definition) {
			definitionsByType.set(oldKey, definition);
		}

		setForm('definition', definitionsByType.get(key));

		return key;
	});

	const formValidate = (form: DeepPartial<SheetValue>): form is SheetValue => {
		const newErrors: FormErrors = {};
	
		if (!form.title) {
			newErrors.title = 'Title is required!';
		}

		if (!form.type) {
			newErrors.type = 'Type is required!';
		}

		if (!form.definitionType) {
			newErrors.definitionType = 'Definition is required!';
		}
	
		const definitionErrors: any = {};

		if (form.definitionType === 'function' && !form.definition?.body) {
			definitionErrors.body = 'Function body is required!';
		}
		
		if (
			form.definitionType === 'variable' &&
			typeof form.definition?.value !== form.type
		) {
			definitionErrors.value = 'Variable value is required!';
		}

		if (!ObjectUtils.isEmpty(definitionErrors)) {
			newErrors.definition = definitionErrors;
		}
	
		setFormErrors(newErrors);
		
		return ObjectUtils.isEmpty(newErrors);
	}

	const onSubmit = () => {
		if (!formValidate(form)) {
			return;
		}

		const oldId = id();
		const newId = form.id;

		setSheet('values', form.id, form);
		
		if (oldId !== undefined && oldId !== newId) {
			graph().delete(oldId);
		}

		if (form.definitionType === 'function') {
			graph().set(newId, context => interpret(form.definition.body, context));
		}
		else {
			graph().set(newId, () => form.definition.value);
		}

		const [index] = Layout.find(sheet.layout, item => {
			return item?.type === 'value' && item.valueId === newId;
		});

		if (sheet.layout.length === index) {
			setSheet('layout', index, { type: 'value', valueId: newId, colSpan: 1 });
		}

		console.log('errors:');
		graph().getErrors(newId).forEach(error => console.error(error));

		navigate(-1);
	}

	createEffect(() => {
		console.log(form.id)
	})

	return (
		<>
			<PageSection childrenContainerClass={styles.container}>
				{id() !== undefined && !(id()! in sheet.values) ? (
					<>{/* TODO: Go to error page */}</>
				) : (
					<>
						<TextInput
							placeholder="Name..."
							value={form.title ?? ''}
							onInput={value => setForm('title', value)}
						/>
						<div class={styles.idContainer}>
							<TextInput
								class={styles.idInput}
								placeholder="Id..."
								value={form.id ?? ''}
								onInput={value => {
									setHasTouchedId(true);
									setForm('id', value);
								}}
							/>
							{hasTouchedId() && (
								<Button
									class={styles.idLinkButton}
									onClick={() => setHasTouchedId(false)}
								>
									<BsLink45deg />
								</Button>
							)}
						</div>
						<TextAreaInput
							placeholder="Description..."
							value={form.description ?? ''}
							onInput={value => setForm('description', value)}
						/>
						<SelectInput
							value={form.type}
							onInput={value => setForm(
								'type',
								(value as 'boolean' | 'number') || undefined
							)}
						>
							<option value="">Type...</option>
							<option value="boolean">Boolean</option>
							<option value="number">Number</option>
						</SelectInput>
					</>
				)}
			</PageSection>
			<PageSection grow childrenContainerClass={styles.container}>
				{form.type && (
					<SelectInput
						value={form.definitionType ?? ''}
						onInput={value => setForm(
							'definitionType',
							(value as 'function' | 'variable') || undefined
						)}
					>
						<option value="">Definition...</option>
						<option value="function">Function</option>
						<option value="variable">Variable</option>
					</SelectInput>
				)}
				{form.definitionType === 'function' && (
					<UserFunctionInput
						value={form.definition?.body ?? ''}
						onInput={body => setForm('definition', { body })}
						placeholder="1 + 2 * ..."
					/>
				)}
			</PageSection>
			<PageSection>
				<Button onClick={onSubmit}>save</Button>
			</PageSection>
		</>
	);
}