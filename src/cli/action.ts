import path from "node:path";
import process from "node:process";

import chalk from "chalk";

import { i18n } from "@i18n/i18n.ts";
import { Downloader } from "@services/Downloader/index.ts";

import { HeadersHandler } from "@helpers/HeadersHandler/index.ts";
import { readLinksFromFile } from "@helpers/readLinksFromFile/index.ts";

import { checkAndCreateFolder } from "@utils/checkAndCreateFolder/index.ts";

export const action = async (
	args: string[],
	options: {
		output: string;
		maxDownloads: string;
		inputFile?: string;
		inspect?: boolean;
		beautify?: boolean;
		details: boolean;
		headersFile?: string;
		exportDefaultHeaders?: boolean | string;
		bufferSize: string;
	},
) => {
	const { maxDownloads, inputFile, details, inspect, beautify, headersFile, exportDefaultHeaders, bufferSize } = options;

	try {
		// Exporting default headers
		if (exportDefaultHeaders !== undefined) {
			const outputPath = typeof exportDefaultHeaders === "string" ? exportDefaultHeaders : undefined;
			await HeadersHandler.exportDefaultHeaders(outputPath);
			return;
		}

		// Preparing the links
		const output = path.resolve(options.output);
		checkAndCreateFolder(output);
		if (args.length > 0 && inputFile) throw new Error(i18n.__("errors.inputFileAndArgLink"));
		const links = inputFile ? readLinksFromFile(inputFile) : args;
		if (links.length === 0) throw new Error(`\n${i18n.__("errors.noLinks")}\n`);

		// pre configuration
		const maxDownloadsNum = parseInt(maxDownloads, 10);
		if (Number.isNaN(maxDownloadsNum) || maxDownloadsNum < 1) {
			throw new Error(i18n.__("errors.invalidMaxDownloads", { value: maxDownloads }));
		}
		const maxBufferSize = parseInt(bufferSize, 10);
		if (Number.isNaN(maxBufferSize) || maxBufferSize < 1) {
			throw new Error(i18n.__("errors.invalidBufferSize", { value: bufferSize }));
		}

		// Init
		const downloader = new Downloader({
			concurrencyLimit: maxDownloadsNum,
			details,
			inspect,
			beautify,
			bufferSize: maxBufferSize,
		});

		if (headersFile) {
			const finalHeaders = await HeadersHandler.buildCustomHeaders(headersFile);
			if (finalHeaders) downloader.setCustomHeaders(finalHeaders);
		}

		downloader.addLinks(links, output);
		downloader.startProcessing();
		downloader.on("completed", ({ downloadedFiles, invalidLinks }: { downloadedFiles: number; invalidLinks: Set<string> }) => {
			if (!inspect && downloadedFiles) {
				const completedTitle = chalk.white.bgGreen(i18n.__("messages.downloadCompleted"));
				console.log(`\n\n${completedTitle}`);
			}
			if (invalidLinks.size) {
				const invalidTitle = chalk.white.bgYellow(i18n.__("errors.invalidLinks"));
				console.log(`\n${invalidTitle}:\n${[...invalidLinks].join("\n")}`);
			}
			process.exit(0);
		});
	} catch (error) {
		if (error instanceof Error) {
			console.error(chalk.white.bgRed.bold(error.message));
		} else {
			console.error(chalk.red.bold(i18n.__("errors.unknown")));
		}
		process.exit(1);
	}
};
