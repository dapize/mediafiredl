/** biome-ignore-all lint/suspicious/noExplicitAny: The "any" here is just for test */
// deno-lint-ignore-file no-explicit-any
import { describe, expect, it, vi } from "vitest";

import { ProgressBar } from "./ProgressBar.ts";

vi.mock("chalk", async () => {
	const actual = await vi.importActual<typeof import("chalk")>("chalk");
	return {
		...actual,
		default: actual,
		white: (str: any) => str,
		green: (str: any) => str,
		yellow: (str: any) => str,
		magenta: (str: any) => str,
		cyanBright: (str: any) => str,
	};
});

describe("ProgressBar", () => {
	it("Should format the file name correctly When a short or long file name is provided", () => {
		const progressBar = new ProgressBar({ details: false });

		const shortFileName = "file.txt";
		const formattedShortFileName = progressBar["formatFileName"](shortFileName, 10);
		expect(formattedShortFileName).toBe("file.txt  ");

		const longFileName = "a-very-long-file-name-that-exceeds-max-length.txt";
		const formattedLongFileName = progressBar["formatFileName"](longFileName, 10);
		expect(formattedLongFileName).toBe("a-very-lo…");
	});

	it("Should generate the progress bar correctly When different percentages and lengths are specified", () => {
		const progressBar = new ProgressBar({ details: false });

		const progressBar20 = progressBar["generateBar"](50, 20);
		expect(progressBar20).toBe("[##########----------]");

		const progressBar10 = progressBar["generateBar"](25, 10);
		expect(progressBar10).toBe("[###-------]");
	});

	it("Should format the progress bar correctly When details are disabled", () => {
		const progressBar = new ProgressBar({ details: false });

		const payload = {
			fileName: "file.txt",
			elapsed: "00:10",
			percentage: 50,
			value: "500MB",
			total: "1GB",
			speed: "50MB/s",
			eta: "00:10",
		};

		const formattedBar = progressBar["formatBar"]({}, {}, payload);
		expect(formattedBar).toBe("file.txt                       [##########----------] 50% 50MB/s [ETA: 00:10]");
	});

	it("Should format the progress bar correctly When details are enabled", () => {
		const progressBar = new ProgressBar({ details: true });

		const payload = {
			fileName: "file.txt",
			elapsed: "00:10",
			percentage: 75,
			value: "750MB",
			total: "1GB",
			speed: "75MB/s",
			eta: "00:05",
		};

		const formattedBar = progressBar["formatBar"]({}, {}, payload);
		expect(formattedBar).toBe("file.txt                       [###############-----] 75% (750MB / 1GB) 75MB/s [Elap: 00:10 | ETA: 00:05]");
	});
});
