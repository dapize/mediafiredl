import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@i18n/i18n.ts';

import { HeadersHandler } from './HeadersHandler.ts';

// Mock de inquirer
vi.mock('@inquirer/prompts', () => ({
	select: vi.fn(),
}));

// Mock de @inquirer/core
vi.mock('@inquirer/core', () => ({
	ExitPromptError: class ExitPromptError extends Error {
		constructor(message?: string) {
			super(message);
			this.name = 'ExitPromptError';
		}
	},
}));

describe('HeadersHandler', () => {
	const testDir = './test-headers-handler';
	const testFiles: string[] = [];

	// Helper para crear archivos de test
	const createTestFile = (filename: string, content: string): string => {
		const filePath = path.join(testDir, filename);
		fs.writeFileSync(filePath, content, 'utf-8');
		testFiles.push(filePath);
		return filePath;
	};

	beforeEach(() => {
		if (!fs.existsSync(testDir)) {
			fs.mkdirSync(testDir, { recursive: true });
		}

		// Limpiar mocks
		vi.clearAllMocks();

		// Mock de console.log, console.warn, console.clear
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'clear').mockImplementation(() => {});

		// Mock de process.exit para evitar que termine los tests
		vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
			throw new Error(`process.exit called with code ${code}`);
		});
	});

	afterEach(() => {
		// Limpiar archivos de test
		testFiles.forEach((file) => {
			if (fs.existsSync(file)) {
				fs.unlinkSync(file);
			}
		});
		testFiles.length = 0;

		// Eliminar directorio de test
		if (fs.existsSync(testDir)) {
			fs.rmdirSync(testDir);
		}

		// Restaurar mocks
		vi.restoreAllMocks();
	});

	describe('exportDefaultHeaders', () => {
		it('should create a file with default headers at default path', async () => {
			const defaultPath = './headers.txt';
			const resolvedPath = path.resolve(defaultPath);

			try {
				await HeadersHandler.exportDefaultHeaders();
			} catch (e) {
				// Esperamos que llame a process.exit(0)
				expect((e as Error).message).toContain('process.exit called with code 0');
			}

			expect(fs.existsSync(resolvedPath)).toBe(true);
			const content = fs.readFileSync(resolvedPath, 'utf-8');

			// Verificar que contiene headers esperados
			expect(content).toContain('User-Agent:');
			expect(content).toContain('Accept:');
			expect(content).toContain('Accept-Encoding: identity');

			// Limpiar archivo creado
			fs.unlinkSync(resolvedPath);
		});

		it('should create a file at custom path when provided', async () => {
			const customPath = path.join(testDir, 'custom-headers.txt');

			try {
				await HeadersHandler.exportDefaultHeaders(customPath);
			} catch (e) {
				expect((e as Error).message).toContain('process.exit called with code 0');
			}

			expect(fs.existsSync(customPath)).toBe(true);
			testFiles.push(customPath);
		});

		it('should write headers in HTTP raw format', async () => {
			const customPath = path.join(testDir, 'test-export.txt');

			try {
				await HeadersHandler.exportDefaultHeaders(customPath);
			} catch (e) {
				expect((e as Error).message).toContain('process.exit called with code 0');
			}

			const content = fs.readFileSync(customPath, 'utf-8');
			const lines = content.split('\n');

			// Cada línea no vacía debe ser formato "Header: Value"
			const headerLines = lines.filter((line) => line.trim() !== '');
			headerLines.forEach((line) => {
				expect(line).toMatch(/^[\w-]+:\s+.+$/);
			});

			testFiles.push(customPath);
		});

		it('should log success message', async () => {
			const customPath = path.join(testDir, 'test-log.txt');

			try {
				await HeadersHandler.exportDefaultHeaders(customPath);
			} catch (e) {
				// Esperado
			}

			expect(console.log).toHaveBeenCalled();
			testFiles.push(customPath);
		});

		it('should call process.exit(0)', async () => {
			const customPath = path.join(testDir, 'test-exit.txt');

			try {
				await HeadersHandler.exportDefaultHeaders(customPath);
			} catch (e) {
				expect((e as Error).message).toContain('process.exit called with code 0');
			}

			testFiles.push(customPath);
		});

		it('Should overwrite the file When the file headers.txt already exists', async () => {
			const filePath = createTestFile('headers.txt', '');
			testFiles.push(filePath);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			try {
				await HeadersHandler.exportDefaultHeaders(filePath);
			} catch (e) {
				expect((e as Error).message).toContain('process.exit called with code 0');
			}
		});

		it("Should show a message When is chosen don't overwrite the file headers.txt", async () => {
			const filePath = createTestFile('headers.txt', '');
			testFiles.push(filePath);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(false);

			try {
				await HeadersHandler.exportDefaultHeaders(filePath);
			} catch (_) {
				// all good XD
			}

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining(i18n.__('messages.exportCancelled')));
		});
	});

	describe('buildCustomHeaders', () => {
		it('should throw error if file does not exist', async () => {
			await expect(HeadersHandler.buildCustomHeaders('nonexistent.txt')).rejects.toThrow(i18n.__('errors.notFoundHeadersFile'));
		});

		it('should parse and return headers without warnings for valid file', async () => {
			const content = `User-Agent: Test/1.0
Accept: */*
Accept-Encoding: identity`;

			const filePath = createTestFile('valid.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(result).toHaveProperty('User-Agent', 'Test/1.0');
			expect(result).toHaveProperty('Accept-Encoding', 'identity');
			// No debe mostrar warnings
			expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('⚠️'));
		});

		it('should show warnings for missing Accept-Encoding', async () => {
			const content = `User-Agent: Test/1.0`;
			const filePath = createTestFile('no-encoding.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			await HeadersHandler.buildCustomHeaders(filePath);

			// Debe mostrar warning
			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
		});

		it('should show warnings for invalid Accept-Encoding', async () => {
			const content = `User-Agent: Test/1.0
Accept-Encoding: gzip, deflate`;

			const filePath = createTestFile('invalid-encoding.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			await HeadersHandler.buildCustomHeaders(filePath);

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
		});

		it('should show warnings for missing User-Agent', async () => {
			const content = `Accept-Encoding: identity`;
			const filePath = createTestFile('no-ua.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			await HeadersHandler.buildCustomHeaders(filePath);

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
		});

		it('should exit if user declines to continue with warnings', async () => {
			const content = `User-Agent: Test/1.0`; // Sin Accept-Encoding
			const filePath = createTestFile('decline.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(false);

			await expect(HeadersHandler.buildCustomHeaders(filePath)).rejects.toThrow('process.exit called with code 0');
		});

		it('should merge custom headers with defaults', async () => {
			const content = `User-Agent: CustomAgent/1.0`;
			const filePath = createTestFile('merge.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			// Custom header override
			expect(result['User-Agent']).toBe('CustomAgent/1.0');
			// Default headers preserved
			expect(result['Accept-Encoding']).toBe('identity');
			expect(result['Connection']).toBe('keep-alive');
		});

		it('should parse JSON format correctly', async () => {
			const content = JSON.stringify({
				'User-Agent': 'JSONTest/1.0',
				Accept: '*/*',
				'Accept-Encoding': 'identity',
			});

			const filePath = createTestFile('test.json', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(result['User-Agent']).toBe('JSONTest/1.0');
			expect(result['Accept-Encoding']).toBe('identity');
		});

		it('should handle ExitPromptError (Ctrl+C)', async () => {
			const content = `User-Agent: Test/1.0`;
			const filePath = createTestFile('ctrl-c.txt', content);

			const { ExitPromptError } = await import('@inquirer/core');
			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockRejectedValue(new ExitPromptError());

			await expect(HeadersHandler.buildCustomHeaders(filePath)).rejects.toThrow('process.exit called with code 0');

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining(i18n.__('messages.operationCancelled')));
		});

		it('should throw error for other exceptions', async () => {
			const content = `User-Agent: Test/1.0`;
			const filePath = createTestFile('error.txt', content);

			const { select } = await import('@inquirer/prompts');
			const testError = new Error('Test error');
			vi.mocked(select).mockRejectedValue(testError);

			await expect(HeadersHandler.buildCustomHeaders(filePath)).rejects.toThrow(i18n.__('errors.failedLoadHeaders'));
		});

		it('should clear console after warnings confirmation', async () => {
			const content = `User-Agent: Test/1.0`; // Falta Accept-Encoding
			const filePath = createTestFile('clear.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			await HeadersHandler.buildCustomHeaders(filePath);

			expect(console.clear).toHaveBeenCalled();
		});
	});

	describe('parseFile (edge cases via buildCustomHeaders)', () => {
		it('should handle HTTP raw format with comments', async () => {
			const content = `# This is a comment
User-Agent: Test/1.0
# Another comment
Accept-Encoding: identity`;

			const filePath = createTestFile('comments.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(result['User-Agent']).toBe('Test/1.0');
			expect(result['Accept-Encoding']).toBe('identity');
		});

		it('should handle HTTP raw format with empty lines', async () => {
			const content = `User-Agent: Test/1.0

Accept-Encoding: identity

Connection: keep-alive`;

			const filePath = createTestFile('empty-lines.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(Object.keys(result).length).toBeGreaterThan(0);
		});

		it('should handle headers with colons in value', async () => {
			const content = `Authorization: Bearer token:with:colons`;
			const filePath = createTestFile('colons.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(result['Authorization']).toBe('Bearer token:with:colons');
		});

		it('should handle headers with multiple spaces', async () => {
			const content = `User-Agent:   Mozilla/5.0   (Windows)  `;
			const filePath = createTestFile('spaces.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(result['User-Agent']).toBe('Mozilla/5.0   (Windows)');
		});

		it('should warn on invalid lines without colon', async () => {
			const content = `User-Agent: Test/1.0
InvalidLineWithoutColon
Accept-Encoding: identity`;

			const filePath = createTestFile('invalid-line.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			await HeadersHandler.buildCustomHeaders(filePath);

			expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('InvalidLineWithoutColon'));
		});

		it('should detect JSON by content even without .json extension', async () => {
			const content = '{ "User-Agent": "Test", "Accept-Encoding": "identity" }';
			const filePath = createTestFile('test.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(result['User-Agent']).toBe('Test');
		});

		it('should convert non-string JSON values to strings', async () => {
			const content = JSON.stringify({
				'X-Number': 123,
				'X-Boolean': true,
				'User-Agent': 'Test',
				'Accept-Encoding': 'identity',
			});

			const filePath = createTestFile('types.json', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(result['X-Number']).toBe('123');
			expect(result['X-Boolean']).toBe('true');
			expect(typeof result['X-Number']).toBe('string');
		});

		it('should throw error on invalid JSON', async () => {
			const content = '{ invalid json }';
			const filePath = createTestFile('invalid.json', content);

			await expect(HeadersHandler.buildCustomHeaders(filePath)).rejects.toThrow(i18n.__('errors.jsonFormatInvalid'));
		});

		it('should throw error on JSON array', async () => {
			const content = '["header1", "header2"]';
			const filePath = createTestFile('array.json', content);

			await expect(HeadersHandler.buildCustomHeaders(filePath)).rejects.toThrow(i18n.__('errors.jsonParsedInvalid'));
		});
	});

	describe('validateCriticalHeaders', () => {
		it('should accept identity in Accept-Encoding with other values', async () => {
			const content = `User-Agent: Test/1.0
Accept-Encoding: gzip, deflate, identity`;

			const filePath = createTestFile('mixed-encoding.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			// No debe mostrar warning de Accept-Encoding
			// (puede mostrar otros warnings si corresponde)
			expect(result).toHaveProperty('Accept-Encoding');
		});
	});

	describe('mergeWithDefaults', () => {
		it('should preserve all default headers when custom is empty', async () => {
			const content = `Accept-Encoding: identity`; // Solo uno mínimo
			const filePath = createTestFile('minimal.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			// Debe tener todos los headers por defecto
			expect(result).toHaveProperty('Connection');
			expect(result).toHaveProperty('DNT');
			expect(result).toHaveProperty('User-Agent');
		});

		it('should allow custom headers to override defaults', async () => {
			const content = `User-Agent: CustomAgent/1.0
Accept: application/json
Connection: close
Accept-Encoding: identity`;

			const filePath = createTestFile('override.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(result['User-Agent']).toBe('CustomAgent/1.0');
			expect(result['Accept']).toBe('application/json');
			expect(result['Connection']).toBe('close');
		});
	});

	describe('Integration tests', () => {
		it('should handle complete workflow with valid headers', async () => {
			const content = `User-Agent: IntegrationTest/1.0
Accept: */*
Accept-Encoding: identity
Connection: keep-alive`;

			const filePath = createTestFile('integration.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true);

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(result).toBeDefined();
			expect(result['User-Agent']).toBe('IntegrationTest/1.0');
			expect(result['Accept-Encoding']).toBe('identity');
		});

		it('should handle workflow with warnings and user confirmation', async () => {
			const content = `User-Agent: WarningTest/1.0`; // Falta Accept-Encoding
			const filePath = createTestFile('warning-flow.txt', content);

			const { select } = await import('@inquirer/prompts');
			vi.mocked(select).mockResolvedValue(true); // Usuario confirma continuar

			const result = await HeadersHandler.buildCustomHeaders(filePath);

			expect(result).toBeDefined();
			expect(result['User-Agent']).toBe('WarningTest/1.0');
			// Debe tener Accept-Encoding del merge con defaults
			expect(result['Accept-Encoding']).toBe('identity');
		});
	});
});
