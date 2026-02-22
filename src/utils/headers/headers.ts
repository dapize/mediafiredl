import type { IHeaders } from "./headers.d.ts";

const baseHeaders: IHeaders = {
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
	Connection: "keep-alive",
	DNT: "1",
};

export const scrapingHeaders: IHeaders = {
	...baseHeaders,
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
	"Accept-Language": "en-US,en;q=0.9",
	Referer: "https://www.google.com/",
	"Sec-Fetch-Dest": "document",
	"Sec-Fetch-Mode": "navigate",
	"Sec-Fetch-Site": "none",
	"Sec-Fetch-User": "?1",
};

export const downloadHeaders: IHeaders = {
	...baseHeaders,
	Accept: "*/*",
	"Accept-Encoding": "identity",
	"Sec-Fetch-Dest": "empty",
	"Sec-Fetch-Mode": "cors",
	"Sec-Fetch-Site": "cross-site",
};
