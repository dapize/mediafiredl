/** biome-ignore-all lint/suspicious/noExplicitAny: Is just for test */
// deno-lint-ignore-file no-explicit-any
import { describe, expect, it } from 'vitest';

import { smartDecode } from './smartDecode.ts';

describe('SmartDecode util', () => {
	it('Should return the content equal was passed When is not a string', () => {
		expect(smartDecode(null as any)).toBe(null);
		expect(smartDecode(undefined as any)).toBe(undefined);
		expect(smartDecode(123 as any)).toBe(123);
		expect(smartDecode({} as any)).toEqual({});
	});

	it('Should correct incorrectly encoded strings When have accented characters.', () => {
		// á = Ã¡, é = Ã©, í = Ã­, ó = Ã³, ú = Ãº
		expect(smartDecode('Ã¡rbol')).toBe('árbol');
		expect(smartDecode('cafÃ©')).toBe('café');
		expect(smartDecode('mÃºsica')).toBe('música');
	});

	it('Should manage multiple characters hidden together', () => {
		const input = '\uFEFFHola\u200B\u00A0Mundo\uFEFF';
		expect(smartDecode(input)).toBe('Hola Mundo');
	});

	it('Should decode the name correctly When the name is encoded', () => {
		const flatName = 'España';
		const nameDecoded = smartDecode('EspaÃ±a');
		expect(nameDecoded).toEqual(flatName);
	});
});
