import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { i18n } from "@i18n/i18n.ts";

import { FileLink } from "./FileLink.ts";

globalThis.fetch = vi.fn() as Mock;

const links = [
	"https://www.mediafire.com/file/v91fqemfiau67jr/please_read_me_%25F0%259F%2591%2589%25F0%259F%2591%2588%25F0%259F%25A5%25BA.txt/file",
	"https://www.mediafire.com/file/yk4df25tarcjvd7/pack.png/file",
	"http://www.mediafire.com/?fp2vb9mlfu6xmd3",
];

describe("FileLink Class Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Should verify file availability When the file is non-premium", async () => {
		(fetch as Mock).mockResolvedValueOnce({
			status: 200,
			headers: new Map(),
		});

		const fileLink = new FileLink(links[0]);
		const isAvailable = await fileLink.isAvailable();

		expect(isAvailable).toBe(true);
		expect(fetch).toHaveBeenCalledWith(links[0], {
			method: "HEAD",
			redirect: "manual",
		});
	});

	it("Should fail file availability When the location headers is missing", async () => {
		(fetch as Mock).mockResolvedValueOnce({
			status: 301,
			headers: new Map(),
		});

		const fileLink = new FileLink(links[0]);
		const isAvailable = await fileLink.isAvailable();

		expect(isAvailable).toBe(false);
	});

	it("Should fail file availability When the location headers is error.php", async () => {
		const fakeHeaders = new Map();
		fakeHeaders.set("location", "https://www.mediafire.com/error.php?errno=320&origin=download");
		(fetch as Mock).mockResolvedValueOnce({
			status: 302,
			headers: fakeHeaders,
		});

		const fileLink = new FileLink(links[0]);
		const isAvailable = await fileLink.isAvailable();

		expect(isAvailable).toBe(false);
	});

	it("Should verify file is unavailable When the file does not exist", async () => {
		(fetch as Mock).mockResolvedValueOnce({
			status: 404,
		});

		const fileLink = new FileLink(links[1]);
		const isAvailable = await fileLink.isAvailable();

		expect(isAvailable).toBe(false);
	});

	it("Should verify file availability When there is a premium redirect", async () => {
		(fetch as Mock).mockResolvedValueOnce({
			status: 302,
			headers: {
				get: vi.fn().mockReturnValue("https://premium-link.com/download"),
			},
		});

		const fileLink = new FileLink(links[2]);
		const isAvailable = await fileLink.isAvailable();

		expect(isAvailable).toBe(true);
		expect(fetch).toHaveBeenCalledWith(links[2], {
			method: "HEAD",
			redirect: "manual",
		});
	});

	it("Should extract details When the file is non-premium", async () => {
		const mockHtml = `
      <a aria-label="Download file" href="https://cdn.mediafire.com/download/pack.png"></a>
      <div class="dl-btn-label" title="pack.png"></div>
      <div>Download (15.2MB)</div>
    `;
		(fetch as Mock).mockResolvedValueOnce({
			text: vi.fn().mockResolvedValueOnce(mockHtml),
		});

		const fileLink = new FileLink(links[1]);
		const details = await fileLink.getDetails();

		expect(details).toEqual({
			fileName: "pack.png",
			url: "https://cdn.mediafire.com/download/pack.png",
			size: 15938355.2,
		});
	});

	it("Should fail extract directLink When the file is non-premium and HTML link change", async () => {
		const mockHtml = "<div></div>";
		(fetch as Mock).mockResolvedValueOnce({
			text: vi.fn().mockResolvedValueOnce(mockHtml),
		});

		const fileLink = new FileLink(links[1]);
		await expect(fileLink.getDetails()).rejects.toThrow(`${i18n.__("errors.extractDetails")}: ${links[1]}`);
	});

	it("Should extract directLink When the file is non-premium and HTML link is a javascript code", async () => {
		const testLink = "https://static.mediafire.com/images/backgrounds/header/mf_logo_mono_reversed.svg";
		const mockHtml = `
      <a aria-label="Download file" href="javascript:void(0)" data-scrambled-url="${btoa(testLink)}"></a>
      <div class="dl-btn-label" title="mf_logo_mono_reversed.svg"></div>
      <div>Download (15.2MB)</div>
    `;
		(fetch as Mock).mockResolvedValueOnce({
			text: vi.fn().mockResolvedValueOnce(mockHtml),
		});

		const fileLink = new FileLink(links[1]);
		const details = await fileLink.getDetails();

		expect(details).toEqual({
			fileName: "mf_logo_mono_reversed.svg",
			url: testLink,
			size: 15938355.2,
		});
	});

	it("Should fail extract file Name When the file is non-premium and HTML was changed and the link is a javascript code", async () => {
		const testLink = "https://static.mediafire.com/images/backgrounds/header/mf_logo_mono_reversed.svg";
		const mockHtml = `
      <a aria-label="Download file" href="javascript:void(0)" data-scrambled-url="${btoa(testLink)}"></a>
      <div></div>
      <div>Download (15.2MB)</div>
    `;
		(fetch as Mock).mockResolvedValueOnce({
			text: vi.fn().mockResolvedValueOnce(mockHtml),
		});

		const fileLink = new FileLink(links[1]);
		await expect(fileLink.getDetails()).rejects.toThrow(`${i18n.__("errors.extractDetails")}: ${links[1]}`);
	});

	it("Should fail extract data-scrambled-url When the file is non-premium and HTML was changed and the link is a javascript code", async () => {
		const mockHtml = `
      <a aria-label="Download file" href="javascript:void(0)"></a>
      <div></div>
      <div>Download (15.2MB)</div>
    `;
		(fetch as Mock).mockResolvedValueOnce({
			text: vi.fn().mockResolvedValueOnce(mockHtml),
		});

		const fileLink = new FileLink(links[1]);
		await expect(fileLink.getDetails()).rejects.toThrow(`${i18n.__("errors.extractDetails")}: ${links[1]}`);
	});

	it("Should extract details When the file is non-premium and is setted scraping headers", async () => {
		(fetch as Mock)
			.mockResolvedValueOnce({
				text: vi.fn().mockResolvedValueOnce(`
      <a aria-label="Download file" href="#"></a>
      <div class="dl-btn-label" title="pack.png"></div>
      <div>Download (15.2MB)</div>
    `),
			})
			.mockResolvedValueOnce({
				text: vi.fn().mockResolvedValueOnce(`
      <a aria-label="Download file" href="https://cdn.mediafire.com/download/pack.png"></a>
      <div class="dl-btn-label" title="pack.png"></div>
      <div>Download (15.2MB)</div>
    `),
			});

		const fileLink = new FileLink(links[1]);
		const details = await fileLink.getDetails();

		expect(details).toEqual({
			fileName: "pack.png",
			url: "https://cdn.mediafire.com/download/pack.png",
			size: 15938355.2,
		});
	});

	it("Should fail extract details When the file is non-premium and the link is # for ever", async () => {
		(fetch as Mock).mockResolvedValue({
			text: vi.fn().mockResolvedValue(`
      <a aria-label="Download file" href="#"></a>
      <div class="dl-btn-label" title="pack.png"></div>
      <div>Download (15.2MB)</div>
    `),
		});

		const fileLink = new FileLink(links[1]);
		await expect(fileLink.getDetails()).rejects.toThrow(`${i18n.__("errors.extractDetails")}: ${links[1]}`);
	});

	it("Should extract details When the file is premium", async () => {
		(fetch as Mock).mockResolvedValueOnce({
			status: 200,
			ok: true,
			headers: {
				get: vi.fn().mockImplementation((header) => {
					if (header === "Content-Disposition") {
						return 'attachment; filename="please_read_me.txt"';
					}
					if (header === "Content-Length") return "123456";
					return null;
				}),
			},
		});

		const fileLink = new FileLink(links[0]);
		fileLink["directLink"] = "https://cdn.mediafire.com/download/please_read_me.txt";
		fileLink["isPremium"] = true;

		const details = await fileLink.getDetails();

		expect(details).toEqual({
			fileName: "please_read_me.txt",
			url: "https://cdn.mediafire.com/download/please_read_me.txt",
			size: 123456,
		});
	});

	it("Should fail extract details When the file is premium but the fetch response is not ok", async () => {
		const statusText = "something here";
		(fetch as Mock).mockResolvedValueOnce({
			status: 301,
			headers: new Map(),
			ok: false,
			statusText,
		});

		const fileLink = new FileLink(links[0]);
		fileLink["isPremium"] = true;
		await expect(fileLink.getDetails()).rejects.toThrow(i18n.__("errors.fetchPureLink", { statusText }));
	});

	it("Should fail extract details When the file is premium but the fetch response is not ok", async () => {
		(fetch as Mock).mockResolvedValueOnce({
			status: 301,
			headers: {
				get: vi.fn().mockImplementation((header) => {
					if (header === "Content-Disposition") {
						return "attachment;";
					}
					if (header === "Content-Length") return "123456";
					return null;
				}),
			},
			ok: true,
		});

		const fileLink = new FileLink(links[0]);
		fileLink["directLink"] = "https://cdn.mediafire.com/download/please_read_me.txt";
		fileLink["isPremium"] = true;

		const details = await fileLink.getDetails();

		expect(details).toEqual({
			fileName: "please_read_me.txt",
			url: "https://cdn.mediafire.com/download/please_read_me.txt",
			size: 123456,
		});
	});
});
