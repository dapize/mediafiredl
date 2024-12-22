import path from 'node:path';
import utf8 from 'utf8';
import type { ILinkDetails } from './FileLink.d.ts';
import { i18n } from '../../i18n/i18n.ts';
import { convertToBytes } from '../../utils/convertToBytes/index.ts';

export class FileLink {
	private rawLink: string;
	private directLink: string | null;
	private isPremium: boolean;

	constructor(link: string) {
		this.rawLink = link;
		this.directLink = null;
		this.isPremium = false;
	}

	public async isAvailable(): Promise<boolean> {
		const response = await fetch(this.rawLink, { method: 'HEAD', redirect: 'manual' });
		const status = response.status;

		if (status >= 400) {
			return false;
		}

		if (status === 301 || status === 302) {
			const location = response.headers.get('location');
			if (location!.includes('/error.php')) {
				return false;
			}
			this.isPremium = true;
			this.directLink = location;
		}

		return true;
	}

	public async getDetails(): Promise<ILinkDetails> {
		if (this.isPremium) {
			return await this.extractDetailsFromPremiumLink();
		}
		return await this.extractDetailsFromNoPremiumLink();
	}

	private async extractDetailsFromNoPremiumLink(): Promise<ILinkDetails> {
		const rawLink = this.rawLink;
		const response = await fetch(rawLink);
		const html = await response.text();

		const directLinkMatch = html.match(/<a[^>]*aria-label="Download file"[^>]*href="([^"]+)"/);
		const fileNameMatch = html.match(/<div[^>]*class="dl-btn-label"[^>]*title="([^"]+)"/);
		const fileSizeMatch = html.match(/Download \(([\d.]+\s?[KMGT]?[B])\)/);

		if (!directLinkMatch || !fileNameMatch || !fileSizeMatch) {
			throw new Error(i18n.__('errors.extractDetails', { rawLink }));
		}

		return {
			url: directLinkMatch[1],
			fileName: utf8.decode(decodeURIComponent(fileNameMatch[1])),
			size: convertToBytes(fileSizeMatch[1]),
		};
	}

	private async extractDetailsFromPremiumLink(): Promise<ILinkDetails> {
		const pureLink = this.directLink!;
		const response = await fetch(pureLink, { method: 'HEAD' });
		if (!response.ok) {
			throw new Error(i18n.__('errors.fetchPureLink', { statusText: response.statusText }));
		}

		const contentDisposition = response.headers.get('Content-Disposition');
		const fileNameMatch = contentDisposition!.match(/filename="([^"]+)"/);
		const fileName = fileNameMatch ? fileNameMatch[1] : path.basename(pureLink);
		const contentLength = response.headers.get('Content-Length');

		return {
			url: pureLink,
			fileName: utf8.decode(decodeURIComponent(fileName)),
			size: Number(contentLength),
		};
	}
}
