import { describe, expect, it, vi } from "vitest";

const { existsSyncMock, readFileSyncMock } = vi.hoisted(() => {
	return {
		existsSyncMock: vi.fn().mockReturnValue(true),
		readFileSyncMock: vi.fn().mockReturnValue(`
link1.txt
link3.txt
link2.txt
`),
	};
});

vi.mock("fs", () => ({
	default: {
		existsSync: existsSyncMock,
		readFileSync: readFileSyncMock,
	},
	existsSync: existsSyncMock,
	readFileSync: readFileSyncMock,
}));

import { i18n } from "@i18n/i18n.ts";

import { readLinksFromFile } from "./readLinksFromFile.ts";

describe("readLinksFromFile", () => {
	it("Should response with throw new Error When the file dont exists", () => {
		existsSyncMock.mockReturnValue(false);
		const filePath = "/fileA.txt";
		expect(() => readLinksFromFile(filePath)).toThrow(i18n.__("errors.notFoundInputFile", { filePath }));
	});

	it("Should read file correctly When file exists", () => {
		existsSyncMock.mockReturnValue(true);
		const filePath = "/fileA.txt";
		const result = readLinksFromFile(filePath);

		expect(readFileSyncMock).toHaveBeenCalledWith(filePath, "utf-8");
		expect(result).toHaveLength(3);
		expect(result).toEqual(["link1.txt", "link3.txt", "link2.txt"]);
	});
});
