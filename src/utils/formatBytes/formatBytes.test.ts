import { describe, expect, it } from "vitest";

import { formatBytes } from "./formatBytes.ts";

describe("formatBytes Utility Function", () => {
	it("Should correctly format bytes When the value is less than 1 KiB", () => {
		expect(formatBytes(512)).toBe("512.00 Bytes");
	});

	it("Should correctly format bytes When the value is exactly 1 KiB", () => {
		expect(formatBytes(1024)).toBe("1.00 KiB");
	});

	it("Should correctly format bytes When the value is in MiB", () => {
		expect(formatBytes(1048576)).toBe("1.00 MiB");
	});

	it("Should correctly format bytes When the value is in GiB", () => {
		expect(formatBytes(1073741824)).toBe("1.00 GiB");
	});

	it("Should correctly format bytes When the value is large, like in TiB", () => {
		expect(formatBytes(1099511627776)).toBe("1.00 TiB");
	});

	it("Should correctly format bytes When the value is extremely large", () => {
		expect(formatBytes(1125899906842624)).toBe("1.00 PiB");
	});

	it("Should round to two decimal places When the value is not an exact multiple", () => {
		expect(formatBytes(1234567)).toBe("1.18 MiB");
		expect(formatBytes(1234567890)).toBe("1.15 GiB");
	});
});
