import path from "node:path";

import { i18n } from "@i18n/i18n.ts";

import { sanitizeFileName } from "@helpers/sanitizeFileName.ts";

import { convertToBytes } from "@utils/convertToBytes/index.ts";
import { scrapingHeaders } from "@utils/headers/headers.ts";
import type { IHeaders } from "@utils/headers/index.ts";
import { smartDecode } from "@utils/smartDecode/index.ts";

import type { ILinkDetails } from "./FileLink.d.ts";

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
		const response = await fetch(this.rawLink, {
			method: "HEAD",
			redirect: "manual",
		});
		const status = response.status;

		if (status >= 400) {
			return false;
		}

		if (status === 301 || status === 302) {
			const location = response.headers.get("location");
			if (!location) {
				return false;
			}
			if (location.includes("/error.php")) {
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

	private async extractDetailsFromNoPremiumLink(headers?: IHeaders, retryCount = 0): Promise<ILinkDetails> {
		const rawLink = this.rawLink;
		const response = await fetch(rawLink, {
			headers: headers || {},
		});
		const html = await response.text();

		let directLinkMatch = html.match(/<a[^>]*aria-label="Download file"[^>]*href="([^"]+)"/);
		if (!directLinkMatch) {
			throw new Error(i18n.__("errors.extractDetails", { rawLink }));
		}

		let pureLink = directLinkMatch[1];
		if (pureLink.includes("javascript:")) {
			directLinkMatch = html.match(/<a[^>]*aria-label="Download file"[^>]*data-scrambled-url="([^"]+)"/);
			if (!directLinkMatch) {
				throw new Error(i18n.__("errors.extractDetails", { rawLink }));
			}
			pureLink = atob(directLinkMatch[1]);
		}

		const fileNameMatch = html.match(/<div[^>]*class="dl-btn-label"[^>]*title="([^"]+)"/);
		const fileSizeMatch = html.match(/Download \(([\d.]+\s?[KMGT]?[B])\)/);

		if (!directLinkMatch || !fileNameMatch || !fileSizeMatch) {
			throw new Error(i18n.__("errors.extractDetails", { rawLink }));
		}

		// fallback logic for new download page UI
		if (pureLink === "#") {
			const retryNumber = retryCount + 1;
			if (retryNumber >= 3) {
				throw new Error(i18n.__("errors.extractDetails", { rawLink }));
			}
			return await this.extractDetailsFromNoPremiumLink(scrapingHeaders, retryNumber);
		}

		const data = {
			url: pureLink,
			fileName: smartDecode(sanitizeFileName(fileNameMatch[1])),
			size: convertToBytes(fileSizeMatch[1]),
		};

		return data;
	}

	private async extractDetailsFromPremiumLink(): Promise<ILinkDetails> {
		const pureLink = this.directLink as string;
		const response = await fetch(pureLink, { method: "HEAD" });
		if (!response.ok) {
			throw new Error(i18n.__("errors.fetchPureLink", { statusText: response.statusText }));
		}

		const contentDisposition = response.headers.get("Content-Disposition") as string;
		const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
		const fileName = fileNameMatch ? fileNameMatch[1] : path.basename(pureLink);
		const contentLength = response.headers.get("Content-Length");

		return {
			url: pureLink,
			fileName: smartDecode(decodeURIComponent(fileName)),
			size: Number(contentLength),
		};
	}
}
