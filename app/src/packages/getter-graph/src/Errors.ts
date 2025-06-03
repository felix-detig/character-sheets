import type { Stringifyable } from './types';

export class ErrorReference<T extends Stringifyable> extends Error {

	#source: T;

	get source() {
		return this.#source;
	}

	constructor(source: T) {
		super(`An error occurred at '${source.toString()}'!`);

		this.#source = source;
	}

}

export class DependencyCycleError<T extends Stringifyable> extends Error {

	#cycle: T[];

	get cycle() {
		return this.#cycle;
	}

	constructor(cycle: T[]) {
		const cycleString = [...cycle, cycle[0]!].map(item => item.toString()).join(' -> ');

		super(`Dependency cycle found: ${cycleString}`);
		
		this.#cycle = cycle;
	}

}

export class DependencyCyclesError<T extends Stringifyable> extends Error {

	#cycles: T[][];

	get cycles() {
		return this.#cycles;
	}

	constructor(cycles: T[][]) {
		const cycleString = cycles
			.map(cycle => [...cycle, cycle[0]!].map(item => item.toString()).join(' -> '))
			.join('\n');

		super(`Dependency cycle found:\n${cycleString}`);
		
		this.#cycles = cycles;
	}

}