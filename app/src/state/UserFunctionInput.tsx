import { createContext, useContext } from 'solid-js';
import type { Token } from 'user-function';

export type UserFunctionInputContextValue = {
	setTokenBinding: (token: Token, html: Node) => void;
	removeTokenBinding: (token: Token, html: Node) => void;
};

const UserFunctionInputContext = createContext<UserFunctionInputContextValue>();

export const UserFunctionInputProvider = UserFunctionInputContext.Provider;

export function useUserFunctionInput() {
	return useContext(UserFunctionInputContext);
}