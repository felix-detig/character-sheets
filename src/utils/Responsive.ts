import { createSignal, type Accessor, onCleanup } from 'solid-js';

/**
 * Allows defining specific value for different screen widths. The passed object keys define
 * the minimum window width the corresponding value is returned.
 * 
 * @example
 * const screenSize = createBreakpoints({
 * 	600: 'medium',
 * 	900: 'large'
 * }, 'small');
 * 
 * return (
 * 	<Show when={screenSize() === 'medium'}>
 * 		// ...
 */
export function createBreakpoints<T>(
	valuesByBreakpoint: { [breakpoint: number]: T }
): Accessor<T | undefined>;
// eslint-disable-next-line no-redeclare
export function createBreakpoints<T>(
	valuesByBreakpoint: { [breakpoint: number]: T },
	defaultValue: T
): Accessor<T>;
// eslint-disable-next-line no-redeclare
export function createBreakpoints<T>(
	valuesByBreakpoint: { [breakpoint: number]: T },
	defaultValue?: T
): Accessor<T | undefined> {
	const breakpoints = Object.keys(valuesByBreakpoint).map(n => parseInt(n));
	breakpoints.sort((a, b) => a - b);

	const currentValue = () => {
		const width = window.innerWidth;
		let currentBreakpoint;

		for (const breakpoint of breakpoints) {
			if (breakpoint > width) {
				break;
			}

			currentBreakpoint = breakpoint;
		}

		if (currentBreakpoint !== undefined) {
			return valuesByBreakpoint[currentBreakpoint];
		}

		return defaultValue;
	}

	const [value, setValue] = createSignal(currentValue());

	const updateValue = () => {
		setValue(currentValue);
	}

	window.addEventListener('resize', updateValue);

	onCleanup(() => {
		window.removeEventListener('resize', updateValue);
	});
	
	return value;
}