import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@helpers/": fileURLToPath(new URL("./src/helpers/", import.meta.url)),
			"@i18n/": fileURLToPath(new URL("./src/i18n/", import.meta.url)),
			"@services/": fileURLToPath(new URL("./src/services/", import.meta.url)),
			"@utils/": fileURLToPath(new URL("./src/utils/", import.meta.url)),
		},
	},
	test: {
		coverage: {
			include: ["src/**/*.ts"],
			exclude: ["src/**/index.ts", "src/**/*.d.ts", "src/**/*.test.ts", "node_modules/**"],
			reporter: ["html", "json", "lcov", "text"],
		},
		globals: true,
	},
});
