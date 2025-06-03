export function isEmpty(object: object): boolean {
	for (const _ in object) {
		return false;
	}

	return true;
}