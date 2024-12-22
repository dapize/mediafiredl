import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { FileLink } from './FileLink';

globalThis.fetch = vi.fn() as Mock;

const links = [
	'https://www.mediafire.com/file/v91fqemfiau67jr/please_read_me_%25F0%259F%2591%2589%25F0%259F%2591%2588%25F0%259F%25A5%25BA.txt/file',
	'https://www.mediafire.com/file/yk4df25tarcjvd7/pack.png/file',
	'http://www.mediafire.com/?fp2vb9mlfu6xmd3',
];

describe('FileLink Class Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('Should verify file availability When the file is non-premium', async () => {
		(fetch as Mock).mockResolvedValueOnce({
			status: 200,
			headers: new Map(),
		});

		const fileLink = new FileLink(links[0]);
		const isAvailable = await fileLink.isAvailable();

		expect(isAvailable).toBe(true);
		expect(fetch).toHaveBeenCalledWith(links[0], { method: 'HEAD', redirect: 'manual' });
	});

	it('Should verify file is unavailable When the file does not exist', async () => {
		(fetch as Mock).mockResolvedValueOnce({
			status: 404,
		});

		const fileLink = new FileLink(links[1]);
		const isAvailable = await fileLink.isAvailable();

		expect(isAvailable).toBe(false);
	});

	it('Should verify file availability When there is a premium redirect', async () => {
		(fetch as Mock).mockResolvedValueOnce({
			status: 302,
			headers: { get: vi.fn().mockReturnValue('https://premium-link.com/download') },
		});

		const fileLink = new FileLink(links[2]);
		const isAvailable = await fileLink.isAvailable();

		expect(isAvailable).toBe(true);
		expect(fetch).toHaveBeenCalledWith(links[2], { method: 'HEAD', redirect: 'manual' });
	});

	it('Should extract details When the file is non-premium', async () => {
		const mockHtml = `
      <a aria-label="Download file" href="https://cdn.mediafire.com/download/pack.png"></a>
      <div class="dl-btn-label" title="pack.png"></div>
      <div>Download (15.2MB)</div>
    `;
		(fetch as Mock).mockResolvedValueOnce({ text: vi.fn().mockResolvedValueOnce(mockHtml) });

		const fileLink = new FileLink(links[1]);
		const details = await fileLink.getDetails();

		expect(details).toEqual({
			fileName: 'pack.png',
			url: 'https://cdn.mediafire.com/download/pack.png',
			size: 15938355.2,
		});
	});

	it('Should extract details When the file is premium', async () => {
		(fetch as Mock).mockResolvedValueOnce({
			status: 200,
			ok: true,
			headers: {
				get: vi.fn().mockImplementation((header) => {
					if (header === 'Content-Disposition') return 'attachment; filename="please_read_me.txt"';
					if (header === 'Content-Length') return '123456';
					return null;
				}),
			},
		});

		const fileLink = new FileLink(links[0]);
		fileLink['directLink'] = 'https://cdn.mediafire.com/download/please_read_me.txt';
		fileLink['isPremium'] = true;

		const details = await fileLink.getDetails();

		expect(details).toEqual({
			fileName: 'please_read_me.txt',
			url: 'https://cdn.mediafire.com/download/please_read_me.txt',
			size: 123456,
		});
	});
});
