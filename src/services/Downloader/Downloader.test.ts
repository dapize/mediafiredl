/** biome-ignore-all lint/suspicious/noExplicitAny: Is for the bug types of Vitest in "mockImplementation" method */
// deno-lint-ignore-file no-explicit-any
import Events from "node:events";
import type { WriteStream } from "node:fs";

import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

const mockWriteStream: Partial<WriteStream> & {
	write: Mock;
	end: Mock;
	on: Mock;
	once: Mock;
	close: Mock;
	destroy: Mock;
	_events?: Record<string, (...args: any[]) => void>;
} = {
	write: vi.fn((_, encoding?: any, callback?: any) => {
		if (typeof encoding === "function") {
			encoding();
		} else if (callback) {
			callback();
		}
		return true;
	}),
	end: vi.fn((callback?: any) => {
		if (callback) callback();
		// Emitir evento 'finish'
		if (mockWriteStream._events?.finish) {
			mockWriteStream._events.finish();
		}
	}) as any,
	on: vi.fn(function (this: any, event: string, handler: (...args: any[]) => void) {
		this._events = this._events || {};
		this._events[event] = handler;
		return this;
	}),
	once: vi.fn(function (this: any, event: string, handler: (...args: any[]) => void) {
		this._events = this._events || {};
		this._events[event] = handler;
		return this;
	}),
	close: vi.fn(),
	destroy: vi.fn(),
	closed: false,
	destroyed: false,
	writable: true,
	_events: {},
};

vi.mock("fs", () => ({
	default: {
		createWriteStream: vi.fn(() => mockWriteStream),
		existsSync: vi.fn(),
		unlinkSync: vi.fn(),
	},
	createWriteStream: vi.fn(() => mockWriteStream),
	existsSync: vi.fn(),
	unlinkSync: vi.fn(),
}));

vi.mock("../../helpers/ProgressBar/index.ts", () => ({
	ProgressBar: vi.fn().mockImplementation(
		class ProgressBar {
			multiBar = {
				create: vi.fn(() => ({
					setTotal: vi.fn(() => {}),
					update: vi.fn(() => {}),
					stop: vi.fn(() => {}),
				})),
			};
			// deno-lint-ignore no-explicit-any
		} as any,
	),
}));

vi.mock("../../utils/formatBytes/index.ts", () => ({
	formatBytes: (bytes: number) => `${bytes}B`,
}));

vi.mock("../../utils/checkAndCreateFolder/index.ts", () => ({
	checkAndCreateFolder: vi.fn(),
}));

const isAvailableMock = vi.fn().mockResolvedValue(true);
const getDetailsMock = vi.fn().mockResolvedValue({
	fileName: "test-file2.txt",
	url: "http://example.com/test-file2.txt",
	size: 38588530,
});
vi.mock("../FileLink/index.ts", () => ({
	FileLink: vi.fn().mockImplementation(
		class FileLink {
			isAvailable = isAvailableMock;
			getDetails = getDetailsMock;
			// deno-lint-ignore no-explicit-any
		} as any,
	),
}));

vi.mock("../FolderLink/index.ts", () => ({
	FolderLink: vi.fn().mockImplementation(
		class FolderLink {
			getLinks = vi.fn().mockResolvedValue(["http://example.com/file1.txt"]);
			getFolderName = vi.fn().mockReturnValue("test-folder");
			// deno-lint-ignore no-explicit-any
		} as any,
	),
}));

import { Downloader } from "./Downloader.ts";

describe("Downloader", () => {
	let downloader: Downloader;
	let fetchMock: Mock;
	let readerMock: any;

	beforeEach(() => {
		vi.clearAllMocks();

		readerMock = vi
			.fn()
			.mockResolvedValueOnce({ value: new Uint8Array([1, 2, 3]), done: false })
			.mockResolvedValueOnce({ value: new Uint8Array([4, 5, 6]), done: false })
			.mockResolvedValueOnce({ done: true });

		fetchMock = vi.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				statusText: "OK",
				body: readerMock,
			}),
		);

		vi.stubGlobal("fetch", fetchMock);

		isAvailableMock.mockResolvedValue(true);
		getDetailsMock.mockResolvedValue({
			fileName: "test-file.txt",
			url: "http://example.com/test-file.txt",
			size: 38588530,
		});

		downloader = new Downloader({ concurrencyLimit: 2, details: true, bufferSize: 128 });
	});

	it("Should initialize correctly When given parameters are provided", () => {
		expect(downloader).toBeInstanceOf(Events);
		expect(downloader["concurrencyLimit"]).toBe(2);
		expect(downloader["linkQueue"].size).toBe(0);
		expect(downloader["linksProcessing"].size).toBe(0);
		expect(downloader["invalidLinks"].size).toBe(0);
	});

	it("Should add links to the queue correctly When valid links are provided", () => {
		downloader.addLinks(["http://example.com/file1.txt", "http://example.com/file2.txt"], "/downloads");
		expect(downloader["linkQueue"].size).toBe(2);
	});

	it.only("Should process and complete downloads correctly When downloads are started", async () => {
		const emitSpy = vi.spyOn(downloader, "emit");

		downloader.addLinks(["http://example.com/file1.txt"], "/downloads");
		downloader.startProcessing();

		await new Promise((resolve) => setTimeout(resolve, 1500));

		expect(emitSpy).toHaveBeenCalledWith("completed", {
			downloadedFiles: 1,
			invalidLinks: new Set(),
		});
		expect(downloader["linkQueue"].size).toBe(0);
		expect(downloader["linksProcessing"].size).toBe(0);
	});

	it("Should handle invalid links correctly When invalid links are added", async () => {
		isAvailableMock.mockResolvedValueOnce(false);

		downloader.addLinks(["http://example.com/invalid-file.txt"], "/downloads");
		downloader.startProcessing();

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(downloader["invalidLinks"].has("http://example.com/invalid-file.txt")).toBe(true);
	});

	it("Should handle folder links correctly When a folder link is provided", () => {
		downloader.addLinks(["http://example.com/folder/test-folder"], "/downloads");
		downloader.startProcessing();
		expect(downloader["linksProcessing"].size).toBeGreaterThan(0);
	});

	it("Should correctly show metadata When inspect is enabled", async () => {
		// biome-ignore lint/complexity/useArrowFunction: For the new way of work of the "mockImplementation" method :V
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(function () {});
		downloader = new Downloader({
			concurrencyLimit: 2,
			details: true,
			inspect: true,
			bufferSize: 128,
		});

		downloader.addLinks(["http://example.com/file1.txt"], "/downloads");
		downloader.startProcessing();

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("http://example.com/file1.txt"));
		consoleSpy.mockRestore();
	});
});
