import DependencyGraph from './DependencyGraph';
import { ErrorReference } from './Errors';
import GetterContext from './GetterContext';
import { Getter, Stringifyable } from './types';

function sameValueZero(a: any, b: any) {
	return Object.is(a, b) || a === 0 && a === b;
}

class GetterGraphNode<K, V> {

	id: K;
	getter: Getter<K, V> | undefined;
	value: V | undefined;
	error: Error | null = null;
	listeners = new Set<(value: V | undefined, id: K) => void>();

	constructor(id: K) {
		this.id = id;
	}

}

/**
 * Allows defining interdependant values via getter functions and handles their
 * dependency relationships and updates.
 */
export default class GetterGraph<K extends Stringifyable, V> {

	#depGraph = new DependencyGraph<K>();
	#nodesById = new Map<K, GetterGraphNode<K, V>>();

	get dep() {
		return this.#depGraph;
	}

	/**
	 * Get the current value associated with `id`.
	 */
	get(id: K): V | undefined {
		return this.#nodesById.get(id)?.value;
	}

	/**
	 * Define the value associated with the passed `id` via `getter`. If the value is different than
	 * before, values dependent on `id` are reevaluated.
	 */
	set(id: K, getter: Getter<K, V>) {
		const node = this.#getNode(id, true);
		
		node.getter = getter;
		node.value = undefined;

		this.#update(id);
	}

	// TODO: dependency cycle information (pass id as first parameter)
	/**
	 * Test the result of a `getter` function as if it was inserted for `id`, but without affecting
	 * other values or the underlying dependency graph.
	 */
	test(getter: Getter<K, V>) {
		const context = new GetterContext<K, V>(id => this.get(id));

		return getter(context);
	}

	// TODO: handle deleted values (do they need further handling?)
	delete(id: K) {
		this.#nodesById.delete(id);
		this.#dispatch(id, undefined);
	}

	on(id: K, listener: (value: V | undefined, id: K) => void) {
		const node = this.#getNode(id, true);

		node.listeners.add(listener);
	}

	off(id: K, listener: (value: V | undefined, id: K) => void): boolean {
		return this.#getNode(id)?.listeners.delete(listener) ?? false;
	}

	#dispatch(id: K, value: V | undefined) {
		const listeners = this.#getNode(id)?.listeners;

		if (!listeners) {
			return;
		}

		for (const listener of listeners) {
			listener(value, id);
		}
	}

	// TODO: detect cycles
	// TODO: nicer errors
	#update(id: K) {
		let newDependencies: Set<K>;

		const context = new GetterContext<K, V>(id => {
			newDependencies.add(id);

			const node = this.#getNode(id);

			if (!node) {
				throw new Error('Undefined!');
			}

			if (node.error) {
				if (node.error instanceof ErrorReference) {
					throw node.error;
				}

				throw new ErrorReference(node.id, node.error);
			}

			if (node?.value === undefined) {
				throw new Error('Huh?');
			}

			return node.value;
		});

		this.#depGraph.traverseDependantsTopological(id, id => {
			const node = this.#getNode(id);

			if (!node) {
				throw new Error('No node');
			}
			
			if (!node.getter) {
				throw new Error(`No getter function registered for id '${id.toString()}'!`);
			}

			newDependencies = new Set();
                
			const oldValue = node.value;
			let newValue;

			try {
				newValue = node.getter(context);
				node.error = null;
			}
			catch(error) {
				node.error = error as Error;
				newValue = undefined;
			}

			node.value = newValue;
			this.#depGraph.setDependencies(id, newDependencies);

			if (sameValueZero(oldValue, newValue)) {
				return false;
			}

			this.#dispatch(id, newValue);

			return true;
		});
	}
	
	#getNode(id: K): GetterGraphNode<K, V> | undefined;
	#getNode(id: K, createIfNotExists: false): GetterGraphNode<K, V> | undefined;
	#getNode(id: K, createIfNotExists: true): GetterGraphNode<K, V>;
	#getNode(id: K, createIfNotExists: boolean = false) {
		let node = this.#nodesById.get(id);

		if (!node && createIfNotExists) {
			node = new GetterGraphNode<K, V>(id);
			this.#nodesById.set(id, node);
		}

		return node;
	}
	
	/**
	 * From Leaves top down update
	 */
	// #update(id: K) {
	// 	const oldValue = this.#valuesById.get(id);

	// 	this.#valuesById.delete(id);

	// 	const called = new Set<K>();
	// 	const stack = [] as { id: K, dependencies: Set<K> }[];
	// 	const newDependenciesById = new Map<K, Set<K>>().set(id, stack[0].dependencies);
	// 	const context = new GetterContext((id: K) => {
	// 		stack.at(-1)!.dependencies.add(id);
	// 		stack.push({ id, dependencies: new Set() });

	// 		const value = this.#resolve(id, context, called);
	// 		const { dependencies } = stack.pop()!;

	// 		newDependenciesById.set(id, dependencies);

	// 		return value;
	// 	});

	// 	for (const [id, newDependencies] of newDependenciesById) {
	// 		this.#depGraph.setDependencies(id, newDependencies);
	// 	}

	// 	stack.push({ id, dependencies: new Set() });
	// 	const newValue = this.#resolve(id, context, new Set());
	// 	stack.pop();

	// 	if (sameValueZero(oldValue, newValue)) {
	// 		return;
	// 	}

	// 	const leaves = new Set<K>();

	// 	this.#depGraph.dfsDependants(id, (dependant, isLeaf) => {
	// 		this.#valuesById.delete(dependant);
			
	// 		if (isLeaf) {
	// 			leaves.add(dependant);
	// 		}
	// 	});

	// 	for (const leaf of leaves) {
	// 		stack.push({ id: leaf, dependencies: new Set() });
	// 		this.#resolve(leaf, context, new Set());
	// 		stack.pop();
	// 	}
	// }

	// #resolve(id: K, context: GetterContext<K, V>, called = new Set<K>()): V {
	// 	if (this.#valuesById.has(id)) {
	// 		return this.#valuesById.get(id) as V;
	// 	}

	// 	if (called.has(id)) {
	// 		// TODO: do meaningful dependency cycle error
	// 		throw new Error('');
	// 	}
	// 	else {
	// 		called.add(id);
	// 	}

	// 	const getter = this.#valueGettersById.get(id);

	// 	if (!getter) {
	// 		throw new Error(`No getter function registered for id '${id.toString()}'!`);
	// 	}

	// 	const value = getter(context);

	// 	this.#valuesById.set(id, value);
	// 	this.#dispatch(id, value);

	// 	return value;
	// }

}