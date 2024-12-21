import fs from 'node:fs';
import process from 'node:process';
import path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import { Downloader } from '../services/Downloader/index.ts';
import { checkAndCreateFolder } from '../utils/checkAndCreateFolder/index.ts';
import { i18n } from '../i18n/i18n.ts';

const readLinksFromFile = (filePath: string): string[] => {
	if (!fs.existsSync(filePath)) {
		throw new Error(i18n.__('errors.notFoundInputFile', { filePath }));
	}

	const content = fs.readFileSync(filePath, 'utf-8');
	return content
		.split('\n')
		.map((line: string) => line.trim())
		.filter((line: string) => line !== '');
};

export const action = (
	args: string[],
	options: {
		output: string;
		maxDownloads: string;
		inputFile?: string;
		inspect?: boolean;
		beautify?: boolean;
		details: boolean;
	},
	command: Command,
) => {
	const { maxDownloads, inputFile, details, inspect, beautify } = options;

	try {
		const output = path.resolve(options.output);
		checkAndCreateFolder(output);

		if (args.length > 0 && inputFile) {
			throw new Error(i18n.__('errors.inputFileAndArgLink'));
		}

		const links = inputFile ? readLinksFromFile(inputFile) : args;

		if (links.length === 0) {
			throw new Error(`\n${i18n.__('errors.noLinks')}\n`);
		}

		const downloader = new Downloader({
			concurrencyLimit: parseInt(maxDownloads, 10),
			details,
			inspect,
			beautify,
		});

		downloader.addLinks(links, output);
		downloader.startProcessing();
		downloader.on('completed', (invalidLinks: Set<string>) => {
			if (!inspect) {
				const completedTitle = chalk.white.bgGreen(i18n.__('messages.downloadCompleted'));
				console.log(`\n\n${completedTitle}`);
			}
			if (invalidLinks.size) {
				const invalidTitle = chalk.white.bgYellow(i18n.__('errors.invalidLinks'));
				console.log(`\n${invalidTitle}:\n${[...invalidLinks]}`);
			}
			process.exit(1);
		});
	} catch (error) {
		if (error instanceof Error) {
			console.error(chalk.white.bgRed.bold(error.message));
		} else {
			console.error(chalk.red.bold(i18n.__('errors.unknown')));
		}
		command.outputHelp();
		process.exit(1);
	}
};
