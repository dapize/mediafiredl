import fs from "node:fs";

import { i18n } from "@i18n/i18n.ts";

export const readLinksFromFile = (filePath: string): string[] => {
	if (!fs.existsSync(filePath)) {
		throw new Error(`${i18n.__("errors.notFoundInputFile")}: ${filePath}`);
	}

	const content = fs.readFileSync(filePath, "utf-8");
	return content
		.split("\n")
		.map((line: string) => line.trim())
		.filter((line: string) => line !== "");
};
