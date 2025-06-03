import { createSignal, onCleanup, onMount, type Accessor, type JSX } from 'solid-js';

export type EventHandlerEvent<T, E extends Event> = Parameters<JSX.EventHandler<T, E>>[0];

export type EventHandlerUnionReturnType<T extends JSX.EventHandlerUnion<any, any>> = (
	T extends JSX.EventHandler<any, any> ? (
		ReturnType<T>
	) : T extends JSX.BoundEventHandler<any, any> ? (
		ReturnType<T[0]>
	) : (
		never
	)
);

export function handleEventHandlerUnion<T, E extends Event>(
	union: JSX.EventHandlerUnion<T, E>,
	event: E
): EventHandlerUnionReturnType<typeof union> {
	if (typeof union === 'function') {
		const handler = union;

		return handler(event as EventHandlerEvent<T, E>);
	}
	
	if (!union || typeof union[0] !== 'function') {
		throw new Error('Invalid union!');
	}

	const handler = union[0];
	const data = union[1];

	return handler(data, event as EventHandlerEvent<T, E>);
}

export function createIsMounted(): Accessor<boolean> {
	const [isMounted, setIsMounted] = createSignal(false);

	onMount(() => setIsMounted(true));
	onCleanup(() => setIsMounted(false));

	return isMounted;
}