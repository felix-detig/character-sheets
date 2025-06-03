/**
 * Does **not** follow the UUID RFC!
 */
export function randomId() {
	const RANDOM_BIT_COUNT = 128;
	const randomArray = new Uint8Array(RANDOM_BIT_COUNT / 8);

	crypto.getRandomValues(randomArray);

	const randomPart = randomArray.reduce((a, b) => a + b.toString(16).padStart(2, '0'), '');
	const timePart = (+Date.now()).toString(36);

	return timePart + '-' + randomPart;
}