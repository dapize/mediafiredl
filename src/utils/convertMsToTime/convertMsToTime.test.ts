import { describe, expect, it } from "vitest";

import { convertMsToTime } from "./convertMsToTime.ts";

describe("formatBytes Utility Function", () => {
	it("Should correctly format bytes When the value is correct", () => {
		expect(convertMsToTime(153055000)).toBe("18:30:55");
	});

	it("Should correctly format bytes When the value is correct 2", () => {
		expect(convertMsToTime(142809)).toBe("00:02:22");
	});
});
