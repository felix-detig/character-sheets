export function isNumber(char: string) {
	const code = char.charCodeAt(0);

	return code >= 48 && code <= 57;
}

export function isLetterUpperCase(char: string) {
	const code = char.charCodeAt(0);

	return code >= 65 && code <= 90;
}

export function isLetterLowerCase(char: string) {
	const code = char.charCodeAt(0);

	return code >= 97 && code <= 122;
}

export function isLetter(char: string) {
	return isLetterUpperCase(char) || isLetterLowerCase(char);
}

export function isIdChar(char: string) {
	return isIdCharStart(char) || isNumber(char);
}

export function isIdCharStart(char: string) {
	return char === '_' || isLetterLowerCase(char);
}

export function isWhitespace(char: string) {
	return (
		char === ' ' ||
		char === '\n' ||
		char === '\r' ||
		char === '\t' ||
		char === '\v' ||
		char === '\f' ||
		char === '\u00a0' || // non-breaking space
		char === '\u1680' || // ogham space
		char === '\u2000' || // en quad
		char === '\u200a' || // hair space
		char === '\u2028' || // line seperator
		char === '\u2029' || // paragraph seperator
		char === '\u202f' || // narrow non-breaking space
		char === '\u205f' || // medium math space
		char === '\u3000' || // ideographic space
		char === '\ufeff' // zero width non-breaking space
	);
}