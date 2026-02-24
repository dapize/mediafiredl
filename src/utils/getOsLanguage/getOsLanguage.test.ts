import { describe, expect, it, vi } from 'vitest';

import { getOsLanguage } from './getOsLanguage.ts';

describe('getOsLanguage', () => {
	it('should return the correct language based on the resolved locale', () => {
		const mockResolvedOptions = vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions');

		mockResolvedOptions.mockReturnValue({
			locale: 'en-US',
			calendar: 'gregory',
			numberingSystem: 'latn',
			timeZone: 'UTC',
		});
		expect(getOsLanguage()).toBe('en');

		mockResolvedOptions.mockReturnValue({
			locale: 'es-ES',
			calendar: 'gregory',
			numberingSystem: 'latn',
			timeZone: 'UTC',
		});
		expect(getOsLanguage()).toBe('es');

		mockResolvedOptions.mockReturnValue({
			locale: 'fr-CA',
			calendar: 'gregory',
			numberingSystem: 'latn',
			timeZone: 'UTC',
		});
		expect(getOsLanguage()).toBe('fr');

		mockResolvedOptions.mockRestore();
	});

	it('should handle locales without a region gracefully', () => {
		const mockResolvedOptions = vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions');

		mockResolvedOptions.mockReturnValue({
			locale: 'en',
			calendar: 'gregory',
			numberingSystem: 'latn',
			timeZone: 'UTC',
		});
		expect(getOsLanguage()).toBe('en');

		mockResolvedOptions.mockRestore();
	});
});
