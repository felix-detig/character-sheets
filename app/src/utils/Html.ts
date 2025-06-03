export function removeChildren(node: Node) {
	while (node.hasChildNodes()) {
		node.lastChild?.remove();
	}
}

export function pageOffsetLeft(element: HTMLElement | null): number {
	let total = 0;

	while (element) {
		total += element.offsetLeft;
		element = element.offsetParent as HTMLElement | null;
	}

	return total;
}

export function pageOffsetTop(element: HTMLElement | null): number {
	let total = 0;

	while (element) {
		total += element.offsetTop;
		element = element.offsetParent as HTMLElement | null;
	}

	return total;
}

export function setCursor(element: HTMLElement, position: number) {
	const selection = getSelection();
	
	if (!selection) {
		return;
	}
	
	const child = findNodeAtOffset(element, position);

	if (!child) {
		return;
	}

	const range = document.createRange();
	const offset = Math.min(child.remainingOffset, child.node.textContent?.length ?? 0);

	range.setStart(child.node, offset);
	range.collapse(true);

	selection.removeAllRanges();
	selection.addRange(range);
}

/**
 * If `offset` points past the end of `parent`, the last text-like node inside parent and the remaining offset from its start are returned.
 * 
 * Based on: https://stackoverflow.com/a/54352392
 */
export function findNodeAtOffset(
	parent: Node,
	offset: number
): { node: Node, remainingOffset: number } | null {
	let targetNode: Node | null = null;

	const rec = (node: Node): boolean => {
		if (node.nodeType === Node.TEXT_NODE || node.nodeName === 'BR') {
			targetNode = node;
			const length = node.nodeName === 'BR' ? 1 : (node.textContent?.length ?? 0);
			
			if (offset - length <= 0) {
				return true;
			}
			else {
				offset -= length;
			}
		}
		else {
			for (let i = 0; i < node.childNodes.length; i++) {
				if (rec(node.childNodes[i])) {
					return true;
				}
			}
		}

		return false;
	}

	rec(parent);

	if (targetNode) {
		return { node: targetNode, remainingOffset: offset };
	}
	else {
		return null;
	}
}