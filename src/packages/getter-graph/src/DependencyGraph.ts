import { DependencyCycleError } from './Errors';

class DependencyGraphNode<T> {

	id: T;
	dependencies: Set<T> = new Set();
	dependants: Set<T> = new Set();

	constructor(id: T) {
		this.id = id;
	}

}

/**
 * A directed graph that allows cycles and does not allow multiple edges with the same start and end.
 */
export default class DependencyGraph<T extends { toString: () => string }> {

	#nodesById = new Map<T, DependencyGraphNode<T>>();

	toString(): string {
		if (this.#nodesById.size === 0) {
			return '{}';
		}

		let out = '{\n';

		for (const node of this.#nodesById.values()) {
			out += `\t${node.id} (${[...node.dependencies].join(', ')})\n`;
		}

		out += '}';

		return out;
	}

	/**
	 * Changes the id of node `oldId` to `newId`.
	 * 
	 * @returns true, if the node exists.
	 */
	change(oldId: T, newId: T): boolean {
		if (this.#nodesById.has(newId)) {
			throw new Error('Id already exists!');
		}

		const node = this.#getNode(oldId);

		if (!node) {
			return false;
		}

		node.id = newId;

		for (const dependency of node.dependencies) {
			const dependencyNode = this.#getNode(dependency, true);

			dependencyNode.dependants.delete(oldId);
			dependencyNode.dependants.add(newId);
		}

		for (const dependant of node.dependants) {
			const dependantNode = this.#getNode(dependant, true);

			dependantNode.dependencies.delete(oldId);
			dependantNode.dependencies.add(newId);
		}

		return true;
	}

	/**
	 * Removes the node `id`.
	 * 
	 * @returns `true`, if node `id` existed.
	 */
	remove(id: T): boolean {
		const node = this.#getNode(id);

		if (!node) {
			return false;
		}

		for (const dependency of node.dependencies) {
			const dependencyNode = this.#getNode(dependency, true);

			dependencyNode.dependants.delete(id);
		}

		for (const dependant of node.dependants) {
			const dependantNode = this.#getNode(dependant, true);

			dependantNode.dependencies.delete(id);
		}

		return true;
	}

	/**
	 * Adds an edge to the graph that represents `dependant` depends on `dependency`. Nothing
	 * happens if the edge already exists. If a node doesn't exist for `dependant` or `dependency`
	 * it gets created.
	 */
	addDependency(dependant: T, dependency: T) {
		const dependantNode = this.#getNode(dependant, true);
		const dependencyNode = this.#getNode(dependency, true);
		
		dependantNode.dependencies.add(dependency);
		dependencyNode.dependants.add(dependant);
	}
	
	/**
	 * Overwrites all dependencies of `dependant` with `newDependencies`.
	 */
	setDependencies(dependant: T, newDependencies: ReadonlySet<T>) {
		const dependantNode = this.#getNode(dependant, true);
		const oldDependencies = dependantNode.dependencies;
		const removedDependencies = oldDependencies.difference(newDependencies);
		const addedDependencies = newDependencies.difference(oldDependencies);

		for (const removedDependency of removedDependencies) {
			const dependencyNode = this.#getNode(removedDependency);

			if (!dependencyNode) {
				continue;
			}

			dependencyNode.dependants.delete(dependant);
			dependantNode.dependencies.delete(removedDependency);

			if (dependencyNode.dependants.size === 0 && dependencyNode.dependencies.size === 0) {
				this.#nodesById.delete(removedDependency);
			}
		}

		for (const addedDependency of addedDependencies) {
			const dependencyNode = this.#getNode(addedDependency, true);

			dependencyNode.dependants.add(dependant);
			dependantNode.dependencies.add(addedDependency);
		}
	}

	// TODO: make not readonly
	/**
	 * Returns all direct dependencies of `dependant`.
	 */
	getDependencies(dependant: T): ReadonlySet<T> {
		return this.#getNode(dependant)?.dependencies ?? new Set();
	}

	/**
	 * Returns all direct and transitive dependencies of `dependant`.
	 */
	getDependenciesAll(dependant: T): Set<T> {
		return this.#getDependenciesAllRec(dependant, new Set());
	}

	#getDependenciesAllRec(dependant: T, visited: Set<T>): Set<T> {
		const node = this.#getNode(dependant);

		if (!node) {
			return visited;
		}

		for (const dependency of node.dependencies) {
			if (visited.has(dependency)) {
				continue;
			}

			visited.add(dependency);

			this.#getDependenciesAllRec(dependency, visited);
		}

		return visited;
	}

	/**
	 * Returns all nodes that directly depend on `dependency`.
	 */
	getDependants(dependancy: T): ReadonlySet<T> {
		return this.#getNode(dependancy)?.dependants ?? new Set();
	}

	/**
	 * Returns all nodes that directly and transitively depend on `dependency`.
	 */
	getDependantsAll(dependancy: T): Set<T> {
		return this.#getDependantsAllRec(dependancy, new Set());
	}

	#getDependantsAllRec(dependancy: T, visited: Set<T>): Set<T> {
		const node = this.#getNode(dependancy);

		if (!node) {
			return visited;
		}

		for (const dependant of node.dependants) {
			if (visited.has(dependant)) {
				continue;
			}

			visited.add(dependant);

			this.#getDependantsAllRec(dependant, visited);
		}

		return visited;
	}

	/**
	 * Returns an array of dependency cycles, that the node `id` or one of its dependencies is
	 * involved in. Each cycle is an array of node ids, where the first element is id of the
	 * repeated node (e.g. the cycle 1 -> 3 -> 2 -> 1 is represented as `[1, 3, 2]`).
	 */
	getCycles(id: T): T[][] {
		const cycles: T[][] = [];

		this.#getCyclesRec(id, [], cycles);

		return cycles;
	}

	#getCyclesRec(id: T, path: T[], foundCycles: T[][]) {
		const pathIndex = path.indexOf(id);

		if (pathIndex !== -1) {
			const cycle = path.slice(pathIndex);

			foundCycles.push(cycle);
			return;
		}

		const node = this.#getNode(id, true);

		if (node.dependencies.size) {
			path.push(id);

			for (const dependency of node.dependencies) {
				this.#getCyclesRec(dependency, path, foundCycles);
			}
			
			path.pop();
		}
	}

	/**
	 * Like {@link DependencyGraph.prototype.getCycles}, but it allows adding or removing
	 * dependencies for the node corresponding to `id`. If a dependency is in both added and
	 * removed, it is handled as added. 
	 */
	testCycles(id: T, added: Set<T>, removed: null): T[][];
	testCycles(id: T, added: null, removed: Set<T>): T[][];
	testCycles(id: T, added: Set<T>, removed: Set<T>): T[][];
	testCycles(id: T, added: Set<T> | null, removed: Set<T> | null = null): T[][] {
		const cycles = [] as T[][];

		this.#testCyclesRec(id, added, removed, [], cycles);

		return cycles;
	}

	#testCyclesRec(
		id: T,
		added: Set<T> | null,
		removed: Set<T> | null,
		path: T[],
		foundCycles: T[][]
	) {
		const pathIndex = path.indexOf(id);

		if (pathIndex !== -1) {
			const cycle = path.slice(pathIndex);

			foundCycles.push(cycle);
			return;
		}

		const node = this.#getNode(id, true);
		let dependencies = node.dependencies;

		// handle added and removed dependencies for initial node
		if (path.length === 0 || path[0] === id) {
			dependencies = new Set(dependencies);
			
			if (removed) {
				for (const removedDependency of removed) {
					dependencies.delete(removedDependency);
				}
			}

			if (added) {
				for (const addedDependency of added) {
					dependencies.add(addedDependency);
				}
			}
		}

		if (dependencies.size) {
			path.push(id);

			for (const dependency of node.dependencies) {
				this.#getCyclesRec(dependency, path, foundCycles);
			}
			
			path.pop();
		}
	}

	/**
	 * @throws {DependencyCycleError}
	 */
	getAllDependantsTopological(id: T): T[] {
		const order = [] as T[];

		this.#getAllDependantsTopologicalRec(id, new Set(), new Set(), order);

		return order;
	}

	#getAllDependantsTopologicalRec(id: T, visited: Set<T>, visiting: Set<T>, order: T[]) {
		if (visiting.has(id)) {
			const path = [...visiting];
			const cycle = path.slice(path.indexOf(id));

			throw new DependencyCycleError(cycle);
		}

		if (visited.has(id)) {
			return;
		}
		else {
			visited.add(id);
		}

		const node = this.#getNode(id, false);

		if (node) {
			visiting.add(id);
			
			for (const dependant of node.dependants) {
				this.#getAllDependantsTopologicalRec(dependant, visited, visiting, order);
			}
			
			visiting.delete(id);
		}

		order.unshift(id);
	}

	/**
	 * Traverses the graph in topological order in dependant direction, starting from the node with
	 * `id`, and executes `callback` at every node (including `id`). If callback returns true, the
	 * callback is also called for its dependants, which are ignored otherwise.
	 */
	traverseDependantsTopological(id: T, callback: (id: T) => boolean) {
		const order = this.getAllDependantsTopological(id);
		const nodesNeedingUpdate = new Set<T>();

		nodesNeedingUpdate.add(id);

		for (const id of order) {
			if (!nodesNeedingUpdate.has(id)) {
				continue;
			}

			if (!callback(id)) {
				continue;
			}

			const node = this.#getNode(id);

			if (!node) {
				continue;
			}

			for (const dependant of node.dependants) {
				nodesNeedingUpdate.add(dependant);
			}
		}
	}

	/**
	 * Traverses the graph depth-first in dependant direction, starting from the node with `id`, and
	 * executes `callback` at every node (including `id`). If callback returns false, the current
	 * path isnt searched further.
	 */
	dfsDependants(id: T, callback: (id: T, isLeaf: boolean, visited: Set<T>) => boolean) {
		this.#dfsDependantsRec(id, new Set(), callback);
	}

	#dfsDependantsRec(
		id: T,
		visited: Set<T>,
		callback: (id: T, isLeaf: boolean, visited: Set<T>) => boolean
	) {
		if (visited.has(id)) {
			return;
		}
		else {
			visited.add(id);
		}

		const node = this.#getNode(id);

		if (!node) {
			callback(id, true, visited);
			return;
		}

		const isLeaf = node.dependants.size === 0;

		if (!callback(id, isLeaf, visited)) {
			return;
		}

		for (const dependant of node.dependants) {
			this.#dfsDependantsRec(dependant, visited, callback);
		}
	}
	
	#getNode(id: T): DependencyGraphNode<T> | undefined;
	#getNode(id: T, createIfNotExists: false): DependencyGraphNode<T> | undefined;
	#getNode(id: T, createIfNotExists: true): DependencyGraphNode<T>;
	#getNode(id: T, createIfNotExists: boolean = false) {
		let node = this.#nodesById.get(id);

		if (!node && createIfNotExists) {
			node = new DependencyGraphNode(id);
			this.#nodesById.set(id, node);
		}

		return node;
	}

}