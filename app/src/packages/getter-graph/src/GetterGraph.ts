import DependencyGraph from './DependencyGraph';
import { DependencyCyclesError, ErrorReference } from './Errors';
import GetterContext from './GetterContext';
import type { Getter, Stringifyable } from './types';

function sameValueZero(a: any, b: any) {
	return Object.is(a, b) || a === 0 && a === b;
}

class GetterGraphNode<K, V> {

	id: K;
	getter: Getter<K, V> | undefined;
	value: V | undefined;
	errors: Error[] = [];
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
	 * 
	 * @returns `true` if no errors were encountered during the update, `false` otherwise.
	 */
	set(id: K, getter: Getter<K, V>): boolean {
		const node = this.#getNode(id, true);
		
		node.getter = getter;
		node.value = undefined;

		return this.#update(id);
	}

	/** 
	 * Returns a an array of errors in the order they occurred when running the corresponding
	 * getter. 
	 */
	getErrors(id: K): readonly Error[] {
		return this.#nodesById.get(id)?.errors ?? [];
	}

	// TODO: dependency cycle information (pass id as first parameter)
	/**
	 * Test the result of a `getter` function as if it was inserted for `id`, but without affecting
	 * other values or the underlying dependency graph.
	 */
	test(getter: Getter<K, V>) {
		const context = new GetterContext<K, V>(([id]) => this.get(id));

		return getter(context);
	}

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

	// TODO: nicer errors
	#update(id: K): boolean {
		let newDependencies: Set<K>;
		let noErrors = true;

		const context = new GetterContext<K, V>(([id]) => {
			newDependencies.add(id);

			const node = this.#getNode(id);

			if (!node) {
				throw new Error('Undefined!');
			}

			if (node.errors.length) {
				// TODO: revise if multiple errors are checked per run
				if (node.errors[0] instanceof ErrorReference) {
					throw node.errors[0];
				}

				throw new ErrorReference(node.id);
			}

			if (node.value === undefined) {
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
			node.errors = [];
            
			const oldValue = node.value;
			let newValue;

			try {
				newValue = node.getter(context);
			}
			catch(error) {
				noErrors = false;
				node.errors.push(error as Error);
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
		
		return this.#checkDependencyCycles(id) && noErrors;
	}

	/**
	 * @returns `true` if no cycles were found, `false` otherwise. 
	 */
	#checkDependencyCycles(id: K): boolean {
		const cycles = this.#depGraph.getCycles(id);

		if (!cycles.length) {
			return true;
		}

		const affectedIds = new Set<K>();

		for (const cycle of cycles) {
			for (const id of cycle) {
				affectedIds.add(id);
			}
		}

		const error = new DependencyCyclesError(cycles);
		
		for (const id of affectedIds) {
			const node = this.#getNode(id);

			if (node) {
				node.errors.push(error);
			}
		}

		return false;
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

}