import styles from './LayoutDropPreview.module.scss';
import { onCleanup, onMount } from 'solid-js';

function parseCssTime(time: string) {
	if (time === '') {
		return 0;
	}

	if (time[0] === '.') {
		time = '0' + time;
	}

	const isMilliseconds = time.endsWith('ms');
	const isSeconds = !isMilliseconds && time.endsWith('s');

	if (isMilliseconds) {
		time = time.slice(0, -2);
	}
	else if (isSeconds) {
		time = time.slice(0, -1);
	}

	return parseFloat(time) * (isSeconds ? 1000 : 1);
}

export default function LayoutDropPreview() {
	let ref!: HTMLDivElement;
	let animationFrame: number;

	onMount(() => {
		const element = document.createElement('div');

		element.classList.add(styles.item);

		ref.appendChild(element);

		animationFrame = requestAnimationFrame(() => {
			element.classList.add(styles.visible);
		});
	});

	onCleanup(() => {
		cancelAnimationFrame(animationFrame);

		const parent = ref.offsetParent;
		const element = ref.firstElementChild as HTMLDivElement;

		if (!parent || !element) {
			return;
		}

		const { width, height, left, top } = ref.getBoundingClientRect();
		const { outlineColor, transitionDelay, transitionDuration } = getComputedStyle(element);

		element.classList.remove(styles.visible);
		element.style.position = 'absolute';
		element.style.left = left + 'px';
		element.style.top = top + 'px';
		element.style.width = width + 'px';
		element.style.height = height + 'px';
		element.style.outlineColor = outlineColor;

		parent.appendChild(element);

		requestAnimationFrame(() => {
			element.style.outlineColor = '';
	
			const delay = parseCssTime(transitionDelay);
			const duration = parseCssTime(transitionDuration);
				
			setTimeout(() => {
				element.remove();
			}, delay + duration);
		});
	});

	return (
		<div ref={ref} />
	);
}