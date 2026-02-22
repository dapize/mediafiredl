import { Command } from "commander";

import { i18n } from "@i18n/i18n.ts";

import denoJson from "../../deno.json" with { type: "json" };
import { action } from "./action.ts";

const program = new Command();

program
	.name("mediafiredl")
	.description(i18n.__("app.description"))
	.version(denoJson.version)
	.argument("[links...]", i18n.__("arguments.links"))
	.option("-o, --output <path>", i18n.__("arguments.output"), "./")
	.option("-m, --max-downloads <number>", i18n.__("arguments.maxDownloads"), "2")
	.option("-i, --input-file <path>", i18n.__("arguments.inputFile"))
	.option("-d, --details", i18n.__("arguments.details"), false)
	.option("--inspect", i18n.__("arguments.inspect"), false)
	.option("--beautify", i18n.__("arguments.beautify"), false)
	.option("-H, --headers-file <path>", i18n.__("arguments.headersFile"))
	.option("--export-default-headers [path]", i18n.__("arguments.exportHeaders"))
	.action(action);

program.addHelpText(
	"after",
	`
💬 ${i18n.__("messages.softwareUseful")} https://github.com/dapize/mediafiredl`,
);

program.parse();
