import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { i18n } from '@i18n/i18n.ts';

import { FolderLink } from './FolderLink.ts';

const exampleLinks = [
	'https://www.mediafire.com/folder/g7ngswqmdobu6/Pack+10',
	'https://www.mediafire.com/folder/izeumkc2778r2/TODO+PARA+EL+VIAJE+A+ESPA\u00d1A2',
	'https://www.mediafire.com/folder/xqub019s2e2l1/no_more_slimes',
];

globalThis.fetch = vi.fn() as Mock;

const mockFilesResponse = {
	response: {
		folder_content: {
			files: [
				{ links: { normal_download: 'https://download1.com/file1.txt' } },
				{ links: { normal_download: 'https://download2.com/file2.jpg' } },
			],
		},
	},
};

const mockFoldersResponse = {
	response: {
		folder_content: {
			folders: [
				{ folderkey: 'abcd1234', name: 'SubFolder1' },
				{ folderkey: 'efgh5678', name: 'SubFolder2' },
			],
		},
	},
};

describe('FolderLink Class Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('Should fetch file links correctly When the folder contains files', async () => {
		(fetch as Mock).mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce(mockFilesResponse),
		});

		const folderLink = new FolderLink(exampleLinks[0]);
		const result = await folderLink['getFilesFromFolder']('g7ngswqmdobu6');
		expect(result).toEqual(['https://download1.com/file1.txt', 'https://download2.com/file2.jpg']);
	});

	it('Should fetch folder links correctly When the folder contains subfolders', async () => {
		(fetch as Mock).mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce(mockFoldersResponse),
		});

		const folderLink = new FolderLink(exampleLinks[1]);
		const result = await folderLink['getFoldersFromFolder']('izeumkc2778r2');
		expect(result).toEqual([
			'https://www.mediafire.com/folder/abcd1234/SubFolder1',
			'https://www.mediafire.com/folder/efgh5678/SubFolder2',
		]);
	});

	it('Should get all links (files and folders) correctly When a folder contains both files and subfolders', async () => {
		(fetch as Mock).mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce(mockFilesResponse),
		});
		(fetch as Mock).mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce(mockFoldersResponse),
		});

		const folderLink = new FolderLink(exampleLinks[2]);
		const result = await folderLink.getLinks();

		expect(result).toEqual([
			'https://download1.com/file1.txt',
			'https://download2.com/file2.jpg',
			'https://www.mediafire.com/folder/abcd1234/SubFolder1',
			'https://www.mediafire.com/folder/efgh5678/SubFolder2',
		]);

		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('Should get the folder name When the link folder is correct', () => {
		const folderLink = new FolderLink(exampleLinks[2]);
		const folderName = folderLink.getFolderName();
		expect(folderName).toEqual('no more slimes');
	});

	it('Should get the folder name by folder key When the link folder dont have folder name', () => {
		let folderLinkIncompleted: string | string[] = exampleLinks[2].split('/');
		folderLinkIncompleted.pop();
		const folderKey = folderLinkIncompleted[folderLinkIncompleted.length - 1];
		folderLinkIncompleted = folderLinkIncompleted.join('/');

		const folderLink = new FolderLink(folderLinkIncompleted as string);
		const folderName = folderLink.getFolderName();
		expect(folderName).toEqual(folderKey);
	});

	it('Should get the folder key When the url is correct', () => {
		const folderLink = new FolderLink(exampleLinks[2]);
		const folderKey = folderLink['getFolderKey']();
		expect(folderKey).toEqual('xqub019s2e2l1');
	});

	it('Should fail to get the folder key When the url is incorrect', () => {
		const folderLink = new FolderLink('https://www.mediafire.com/folder/no_more_slimes');
		expect(() => folderLink['getFolderKey']()).toThrowError(i18n.__('errors.gettingFolderKey'));
	});
});
