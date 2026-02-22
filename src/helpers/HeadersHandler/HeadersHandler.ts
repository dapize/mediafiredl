import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import process from "node:process";
import { IHeaders, downloadHeaders } from "../../utils/headers/index.ts";
import { i18n } from "../../i18n/i18n.ts";
import { select } from '@inquirer/prompts';
import { ExitPromptError } from '@inquirer/core';

export class HeadersHandler {
  static async exportDefaultHeaders(outputPath?: string) {
    const defaultPath = outputPath || "./headers.txt";
    const resolvedPath = path.resolve(defaultPath);

    if (fs.existsSync(resolvedPath)) {
      const overwrite = await select({
        message: chalk.cyan(i18n.__("prompts.fileExists", { path: resolvedPath })),
        choices: [
          { name: i18n.__("answers.no"), value: false },
          { name: i18n.__("answers.yes"), value: true }
        ]
      });
      if (!overwrite) {
        console.log(i18n.__("messages.exportCancelled"));
        process.exit(0);
      }
    }

    const content = Object.entries(downloadHeaders).map(([key, value]) => `${key}: ${value}`).join("\n");
    fs.writeFileSync(resolvedPath, content, "utf-8");

    console.log(chalk.green(`${i18n.__("messages.headersExportedTo")}: ${resolvedPath}`));
    console.log(
      chalk.cyan(
        `\n${i18n.__("messages.exportedHeaders")}: -H ` +
          path.basename(resolvedPath),
      ),
    );
    process.exit(0);
  }
  
  static async buildCustomHeaders(headersFilePath: string): Promise<IHeaders> {
    try {
      const parsedHeaders = this.parseFile(headersFilePath);
      const warnings = this.validateCriticalHeaders(parsedHeaders);

      if (warnings.length) {
        console.log(chalk.yellow(`\n⚠️  ${i18n.__("warnings.titleWarnings")}:`));
        warnings.forEach((warning) => console.log(chalk.yellow(`   ${warning}`)));
        console.log();
        const confirmed = await select({
          message: chalk.cyan(i18n.__("prompts.despiteWarnings")),
          choices: [
            { name: i18n.__("answers.no"), value: false },
            { name: i18n.__("answers.yes"), value: true }
          ]
        });
        
        if (!confirmed) {
          process.exit(0);
        }
      }

      console.clear();
      return this.mergeWithDefaults(parsedHeaders);
    } catch (error) {
      if (error instanceof ExitPromptError) {
        console.log(`\n${i18n.__("messages.operationCancelled")} (Ctrl+C).`);
        process.exit(0);
      } else {
        throw new Error(
          `${i18n.__("errors.failedLoadHeaders")}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }

  private static parseFile(filePath: string): IHeaders {
    if (!fs.existsSync(filePath)) {
      throw new Error(`${i18n.__("errors.notFoundHeadersFile")}: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, "utf-8").trim();
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".json" || content.startsWith("{")) {
      return this.parseJSON(content);
    }

    return this.parseHTTPRaw(content);
  }

  private static validateCriticalHeaders(headers: IHeaders): string[] {
    const warnings: string[] = [];

    if (!headers["Accept-Encoding"]) {
      warnings.push(i18n.__("warnings.acceptEncodingMissing"));
    } else if (
      headers["Accept-Encoding"] !== "identity" &&
      !headers["Accept-Encoding"].includes("identity")
    ) {
      warnings.push(i18n.__("warnings.acceptEncodingInvalid", { valueHeader: headers["Accept-Encoding"] }));
    }

    if (!headers["User-Agent"]) {
      warnings.push(i18n.__("warnings.userAgentMissing"));
    }

    return warnings;
  }

  private static mergeWithDefaults(customHeaders: IHeaders): IHeaders {
    return {
      ...downloadHeaders,
      ...customHeaders,
    };
  }

  private static parseJSON(content: string): IHeaders {
    try {
      const parsed = JSON.parse(content);

      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(i18n.__("errors.jsonParsedInvalid"));
      }

      // Convertir todos los valores a string
      const headers: IHeaders = {};
      for (const [key, value] of Object.entries(parsed)) {
        headers[key] = String(value);
      }

      return headers;
    } catch (error) {
      throw new Error(
        `${i18n.__("errors.jsonFormatInvalid")}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private static parseHTTPRaw(content: string): IHeaders {
    const headers: IHeaders = {};
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Ignorar líneas vacías y comentarios
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      // Buscar el primer ':' para separar key:value
      const colonIndex = trimmedLine.indexOf(":");
      if (colonIndex === -1) {
        console.warn(`${i18n.__("warnings.headerLineInvalid")}: ${trimmedLine}`);
        continue;
      }

      const key = trimmedLine.slice(0, colonIndex).trim();
      const value = trimmedLine.slice(colonIndex + 1).trim();

      if (key && value) {
        headers[key] = value;
      }
    }

    return headers;
  }
}