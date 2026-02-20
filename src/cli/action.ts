import fs from "node:fs";
import process from "node:process";
import path from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import { Downloader } from "../services/Downloader/index.ts";
import { checkAndCreateFolder } from "../utils/checkAndCreateFolder/index.ts";
import { i18n } from "../i18n/i18n.ts";
import { HeadersFileParser } from "../helpers/HeadersFileParser/index.ts";
import { readLinksFromFile } from "../helpers/readLinksFromFile.ts";


const handleExportDefaultHeaders = (outputPath?: string) => {
  const defaultPath = outputPath || "./headers.txt";
  const resolvedPath = path.resolve(defaultPath);
  const content = HeadersFileParser.exportDefaultHeaders();

  fs.writeFileSync(resolvedPath, content, "utf-8");

  console.log(chalk.green(`Default headers exported to: ${resolvedPath}`));
  console.log(
    chalk.cyan(
      "\nYou can now edit this file and use it with: -H " +
        path.basename(resolvedPath),
    ),
  );
  process.exit(0);
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
    headersFile?: string;
    exportDefaultHeaders?: boolean | string;
  },
  command: Command,
) => {
  const {
    maxDownloads,
    inputFile,
    details,
    inspect,
    beautify,
    headersFile,
    exportDefaultHeaders,
  } = options;

  try {
    if (exportDefaultHeaders !== undefined) {
      const outputPath = typeof exportDefaultHeaders === "string"
        ? exportDefaultHeaders
        : undefined;
      handleExportDefaultHeaders(outputPath);
      return;
    }

    const output = path.resolve(options.output);
    checkAndCreateFolder(output);

    if (args.length > 0 && inputFile) {
      throw new Error(i18n.__("errors.inputFileAndArgLink"));
    }

    const links = inputFile ? readLinksFromFile(inputFile) : args;

    if (links.length === 0) {
      throw new Error(`\n${i18n.__("errors.noLinks")}\n`);
    }

    const downloader = new Downloader({
      concurrencyLimit: parseInt(maxDownloads, 10),
      details,
      inspect,
      beautify,
    });

    if (headersFile) {
      downloader.setCustomHeaders(headersFile);
    }

    downloader.addLinks(links, output);
    downloader.startProcessing();
    downloader.on("completed", ({downloadedFiles, invalidLinks}: { downloadedFiles: number, invalidLinks: Set<string>}) => {
      if (!inspect && downloadedFiles) {
        const completedTitle = chalk.white.bgGreen(
          i18n.__("messages.downloadCompleted"),
        );
        console.log(`\n\n${completedTitle}`);
      }
      if (invalidLinks.size) {
        const invalidTitle = chalk.white.bgYellow(
          i18n.__("errors.invalidLinks"),
        );
        console.log(`\n${invalidTitle}:\n${[...invalidLinks].join('\n')}`);
      }
      process.exit(1);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.white.bgRed.bold(error.message));
    } else {
      console.error(chalk.red.bold(i18n.__("errors.unknown")));
    }
    command.outputHelp();
    process.exit(1);
  }
};
