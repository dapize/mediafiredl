import Events from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Downloader } from './Downloader.ts';

vi.mock('fs');

const readerMock = {
	read: vi
		.fn()
		.mockResolvedValueOnce({ value: new Uint8Array([1, 2, 3]), done: false })
		.mockResolvedValueOnce({ value: new Uint8Array([4, 5, 6]), done: false })
		.mockResolvedValueOnce({ done: true }),
};

vi.mock('node:global', () => ({
	fetch: vi.fn(() =>
		Promise.resolve({
			body: {
				getReader: () => readerMock,
			},
		})
	),
}));

vi.mock('../../helpers/ProgressBar/index.ts', () => ({
	ProgressBar: vi.fn().mockImplementation(() => ({
		multiBar: {
			create: vi.fn(() => ({
				setTotal: vi.fn(() => console.log('setTotal called')),
				update: vi.fn(() => console.log('update called')),
				stop: vi.fn(() => console.log('stop called')),
			})),
		},
	})),
}));

vi.mock('../../utils/formatBytes/index.ts', () => ({
	formatBytes: (bytes: number) => `${bytes}B`,
}));

vi.mock('../../utils/checkAndCreateFolder/index.ts', () => ({
	checkAndCreateFolder: vi.fn(),
}));

const fileLinkMock = {
	isAvailable: vi.fn().mockResolvedValue(true),
	getDetails: vi.fn().mockResolvedValue({
		fileName: 'test-file2.txt',
		url: 'http://example.com/test-file2.txt',
		size: 38588530,
	}),
};

vi.mock('../FileLink/index.ts', () => ({
	FileLink: vi.fn(() => fileLinkMock),
}));

vi.mock('../FolderLink/index.ts', () => ({
	FolderLink: vi.fn().mockImplementation(() => ({
		getLinks: vi.fn().mockResolvedValue(['http://example.com/file1.txt']),
		getFolderName: vi.fn().mockReturnValue('test-folder'),
	})),
}));

describe('Downloader', () => {
	let downloader: Downloader;

	beforeEach(() => {
		downloader = new Downloader({ concurrencyLimit: 2, details: true });
		fileLinkMock.isAvailable.mockResolvedValue(true);
		fileLinkMock.getDetails.mockResolvedValue({
			fileName: 'test-file.txt',
			url: 'http://example.com/test-file.txt',
			size: 38588530,
		});
	});

	it('Should initialize correctly When given parameters are provided', () => {
		expect(downloader).toBeInstanceOf(Events);
		expect(downloader['concurrencyLimit']).toBe(2);
		expect(downloader['linkQueue'].size).toBe(0);
		expect(downloader['linksProcessing'].size).toBe(0);
		expect(downloader['invalidLinks'].size).toBe(0);
	});

	it('Should add links to the queue correctly When valid links are provided', () => {
		downloader.addLinks(
			['http://example.com/file1.txt', 'http://example.com/file2.txt'],
			'/downloads',
		);
		expect(downloader['linkQueue'].size).toBe(2);
	});

	it('Should process and complete downloads correctly When downloads are started', async () => {
		const emitSpy = vi.spyOn(downloader, 'emit');

		downloader.addLinks(['http://example.com/file1.txt'], '/downloads');
		downloader.startProcessing();

		await new Promise((resolve) => setTimeout(resolve, 1500));

		expect(emitSpy).toHaveBeenCalledWith('completed', new Set());
		expect(downloader['linkQueue'].size).toBe(0);
		expect(downloader['linksProcessing'].size).toBe(0);
	});

	it('Should handle invalid links correctly When invalid links are added', async () => {
		fileLinkMock.isAvailable.mockResolvedValueOnce(false);

		downloader.addLinks(['http://example.com/invalid-file.txt'], '/downloads');
		downloader.startProcessing();

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(
			downloader['invalidLinks'].has('http://example.com/invalid-file.txt'),
		).toBe(true);
	});

	it('Should handle folder links correctly When a folder link is provided', () => {
		downloader.addLinks(
			['http://example.com/folder/test-folder'],
			'/downloads',
		);
		downloader.startProcessing();
		expect(downloader['linksProcessing'].size).toBeGreaterThan(0);
	});

	it('Should correctly show metadata When inspect is enabled', async () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		downloader = new Downloader({
			concurrencyLimit: 2,
			details: true,
			inspect: true,
		});

		downloader.addLinks(['http://example.com/file1.txt'], '/downloads');
		downloader.startProcessing();

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('http://example.com/file1.txt'),
		);
		consoleSpy.mockRestore();
	});
});
