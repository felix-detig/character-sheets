type CssClass = string | false | null | undefined | CssClass[];

/**
 * Joins strings to pass them to the `class` prop. Allows falsey values, which are ignored. Prefer
 * `classList` for conditional styles.
 * 
 * @example
 * <Button class={classes(styles.myButton, IS_DEV && 'rainbow', ...moreClasses)} />
 */
export const classes = (...cssClasses: CssClass[]) => {
	let joined = '';

	for (const cssClass of cssClasses) {
		if (cssClass) {
			const nextClass = typeof cssClass === 'string' ? cssClass : classes(...cssClass);

			joined += ' ' + nextClass;
		}
	}

	return joined;
}