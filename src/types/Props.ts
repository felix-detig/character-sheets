import { ComponentProps, ValidComponent } from 'solid-js';

export type PropsWithClass = {
	class?: string,
	classList?: { [k: string]: boolean | undefined }
};

export type PropsWithComponent<T extends ValidComponent, Prop extends string = 'component'> =
	ComponentProps<T> & { [K in Prop]: T };

export type PropsWithOptionalComponent<
	T extends ValidComponent,
	Prop extends string = 'component'
> =
	ComponentProps<T> & { [K in Prop]?: T };