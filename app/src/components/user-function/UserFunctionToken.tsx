import type { PropsWithClass } from 'types/Solid';
import { type TokenType, type Token } from 'user-function';
import styles from './UserFunctionToken.module.scss';
import { classes } from 'utils/Css';
import { createEffect, onCleanup } from 'solid-js';
import { useUserFunctionInput } from 'state/UserFunctionInput';

export type UserFunctionTokenProps = PropsWithClass & {
	token: Token;
};

const tokenTypesByCssClass: Record<string, TokenType[]> = {
	operatorNumber: ['+', '-', '*', '*', '/', '/_', '/^'],
	operatorBoolean: ['not', 'and', 'or'],
	operatorComparison: ['<', '<=', '=', '>=', '>'],
	keyword: ['if', 'else'],
	invalid: ['invalid'],
	number: ['number'],
	boolean: ['true', 'false'],
	parenthesis: ['(', ')'],
	blockBracket: ['{', '}'],
};

const cssClassesByTokenType: Partial<Record<TokenType, string>> = {};

for (const [cssClass, tokenTypes] of Object.entries(tokenTypesByCssClass)) {
	for (const tokenType of tokenTypes) {
		cssClassesByTokenType[tokenType] = cssClass;
	}
}

function cssClass(token: Token): string | undefined {
	const identifier = cssClassesByTokenType[token.type];

	if (identifier) {
		return styles[identifier];
	}
	else {
		return undefined;
	}
}

export default function UserFunctionToken(props: UserFunctionTokenProps) {
	const context = useUserFunctionInput();
	let ref!: HTMLSpanElement;

	createEffect(() => {
		if (context) {
			context.setTokenBinding(props.token, ref);

			onCleanup(() => context.removeTokenBinding(props.token, ref));
		}
	});

	return (
		<span
			ref={ref}
			class={classes(styles.token, cssClass(props.token), props.class)}
			classList={props.classList}
		>
			{props.token.value}
		</span>
	);
}