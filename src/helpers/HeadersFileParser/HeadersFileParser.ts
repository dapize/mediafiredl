import fs from "node:fs";
import path from "node:path";
import { IHeaders, downloadHeaders } from "../../utils/headers/index.ts";
import { i18n } from "../../i18n/i18n.ts";

export class HeadersFileParser {
  static parseFile(filePath: string): IHeaders {
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

  static validateCriticalHeaders(headers: IHeaders): string[] {
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

  static mergeWithDefaults(customHeaders: IHeaders): IHeaders {
    return {
      ...downloadHeaders,
      ...customHeaders,
    };
  }

  static exportDefaultHeaders(): string {
    const lines: string[] = [
      "# MediaFire DL - Default Headers",
      "# You can modify these headers and use them with --headers-file",
      "# Format: Header-Name: Header-Value",
      "#",
      "# Critical headers:",
      "#   Accept-Encoding: identity  (prevents file corruption)",
      "#   User-Agent: ...            (prevents blocking)",
      "",
    ];

    for (const [key, value] of Object.entries(downloadHeaders)) {
      lines.push(`${key}: ${value}`);
    }

    return lines.join("\n");
  }
}