export function time(label: string, fn: () => void): void {
	console.time(label);
	fn();
	console.timeEnd(label);
}