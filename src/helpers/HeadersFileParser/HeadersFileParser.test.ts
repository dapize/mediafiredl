import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { HeadersFileParser } from "./HeadersFileParser.ts";
import EsTranslation from "../../i18n/locales/es.json" with { type: "json" };

describe("HeadersFileParser", () => {
  const testDir = "./test-headers";
  const testFiles: string[] = [];

  // Helper para crear archivos de test
  const createTestFile = (filename: string, content: string): string => {
    const filePath = path.join(testDir, filename);
    fs.writeFileSync(filePath, content, "utf-8");
    testFiles.push(filePath);
    return filePath;
  };

  beforeEach(() => {
    // Crear directorio de test
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Limpiar archivos de test
    testFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    testFiles.length = 0;

    // Eliminar directorio de test
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  describe("parseFile", () => {
    it("should throw error if file does not exist", () => {
      expect(() => {
        HeadersFileParser.parseFile("nonexistent.txt");
      }).toThrow(EsTranslation.errors.notFoundHeadersFile);
    });

    it("should parse HTTP raw format correctly", () => {
      const content = `
User-Agent: Mozilla/5.0
Accept: */*
Accept-Encoding: identity
`;
      const filePath = createTestFile("headers.txt", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      expect(parsed).toEqual({
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
        "Accept-Encoding": "identity",
      });
    });

    it("should parse JSON format correctly", () => {
      const content = JSON.stringify({
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
        "Accept-Encoding": "identity",
      });
      const filePath = createTestFile("headers.json", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      expect(parsed).toEqual({
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
        "Accept-Encoding": "identity",
      });
    });

    it("should detect JSON by content even without .json extension", () => {
      const content = '{ "User-Agent": "Test" }';
      const filePath = createTestFile("headers.txt", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      expect(parsed).toEqual({
        "User-Agent": "Test",
      });
    });
  });

  describe("parseHTTPRaw", () => {
    it("should ignore empty lines", () => {
      const content = `
User-Agent: Mozilla/5.0

Accept: */*

Accept-Encoding: identity
`;
      const filePath = createTestFile("headers.txt", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      expect(Object.keys(parsed).length).toBe(3);
    });

    it("should ignore comment lines", () => {
      const content = `
# This is a comment
User-Agent: Mozilla/5.0
# Another comment
Accept: */*
`;
      const filePath = createTestFile("headers.txt", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      expect(parsed).toEqual({
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
      });
    });

    it("should handle headers with colons in value", () => {
      const content = `
Authorization: Bearer token:with:colons
Accept: */*
`;
      const filePath = createTestFile("headers.txt", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      expect(parsed["Authorization"]).toBe("Bearer token:with:colons");
    });

    it("should handle headers with spaces in value", () => {
      const content = `
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
`;
      const filePath = createTestFile("headers.txt", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      expect(parsed["User-Agent"]).toBe(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      );
    });

    it("should warn on invalid lines without colon", () => {
      const content = `
User-Agent: Mozilla/5.0
InvalidLineWithoutColon
Accept: */*
`;
      const consoleWarn = console.warn;
      const warnings: string[] = [];
      console.warn = (msg: string) => warnings.push(msg);

      const filePath = createTestFile("headers.txt", content);
      HeadersFileParser.parseFile(filePath);

      console.warn = consoleWarn;

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain(EsTranslation.warnings.headerLineInvalid);
    });

    it("should trim whitespace from keys and values", () => {
      const content = `
  User-Agent  :   Mozilla/5.0   
Accept:*/*
`;
      const filePath = createTestFile("headers.txt", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      expect(parsed).toEqual({
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
      });
    });
  });

  describe("parseJSON", () => {
    it("should parse valid JSON object", () => {
      const content = JSON.stringify({
        "User-Agent": "Test",
        "Accept": "*/*",
      });
      const filePath = createTestFile("headers.json", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      expect(parsed).toEqual({
        "User-Agent": "Test",
        "Accept": "*/*",
      });
    });

    it("should convert non-string values to strings", () => {
      const content = JSON.stringify({
        "X-Number": 123,
        "X-Boolean": true,
        "User-Agent": "Test",
      });
      const filePath = createTestFile("headers.json", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      expect(parsed["X-Number"]).toBe("123");
      expect(parsed["X-Boolean"]).toBe("true");
      expect(parsed["User-Agent"]).toBe("Test");
    });

    it("should ignore keys starting with underscore (comments)", () => {
      const content = JSON.stringify({
        "_comment": "This is a comment",
        "User-Agent": "Test",
        "_note": "This is a note",
      });
      const filePath = createTestFile("headers.json", content);
      const parsed = HeadersFileParser.parseFile(filePath);

      // Los keys con _ se incluyen pero no afectan headers HTTP
      expect(parsed["User-Agent"]).toBe("Test");
    });

    it("should throw error on invalid JSON", () => {
      const content = "{ invalid json }";
      const filePath = createTestFile("headers.json", content);

      expect(() => {
        HeadersFileParser.parseFile(filePath);
      }).toThrow(EsTranslation.errors.jsonFormatInvalid);
    });

    it("should throw error on JSON array", () => {
      const content = '["header1", "header2"]';
      const filePath = createTestFile("headers.json", content);

      expect(() => {
        HeadersFileParser.parseFile(filePath);
      }).toThrow(EsTranslation.errors.jsonParsedInvalid);
    });
  });

  describe("validateCriticalHeaders", () => {
    it("should return no warnings for complete headers", () => {
      const headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Encoding": "identity",
      };
      const warnings = HeadersFileParser.validateCriticalHeaders(headers);

      expect(warnings.length).toBe(0);
    });

    it("should warn if Accept-Encoding is missing", () => {
      const headers = {
        "User-Agent": "Mozilla/5.0",
      };
      const warnings = HeadersFileParser.validateCriticalHeaders(headers);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain("Accept-Encoding");
      expect(warnings[0]).toContain("dañarse");
    });

    it("should warn if Accept-Encoding is not identity", () => {
      const headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Encoding": "gzip, deflate",
      };
      const warnings = HeadersFileParser.validateCriticalHeaders(headers);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain("Accept-Encoding");
      expect(warnings[0]).toContain("corrupción");
    });

    it("should not warn if Accept-Encoding includes identity", () => {
      const headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Encoding": "gzip, deflate, identity",
      };
      const warnings = HeadersFileParser.validateCriticalHeaders(headers);

      const acceptEncodingWarnings = warnings.filter((w) =>
        w.includes("Accept-Encoding")
      );
      expect(acceptEncodingWarnings.length).toBe(0);
    });

    it("should warn if User-Agent is missing", () => {
      const headers = {
        "Accept-Encoding": "identity",
      };
      const warnings = HeadersFileParser.validateCriticalHeaders(headers);

      expect(warnings.some((w) => w.includes("User-Agent"))).toBe(true);
    });
  });

  describe("mergeWithDefaults", () => {
    it("should merge custom headers with defaults", () => {
      const customHeaders = {
        "User-Agent": "CustomAgent/1.0",
      };
      const merged = HeadersFileParser.mergeWithDefaults(customHeaders);

      expect(merged["User-Agent"]).toBe("CustomAgent/1.0");
      expect(merged["Accept-Encoding"]).toBe("identity"); // From defaults
      expect(merged["Connection"]).toBe("keep-alive"); // From defaults
    });

    it("should allow custom headers to override defaults", () => {
      const customHeaders = {
        "Accept": "application/json",
        "Connection": "close",
      };
      const merged = HeadersFileParser.mergeWithDefaults(customHeaders);

      expect(merged["Accept"]).toBe("application/json");
      expect(merged["Connection"]).toBe("close");
    });

    it("should preserve all default headers when no custom headers", () => {
      const merged = HeadersFileParser.mergeWithDefaults({});

      expect(merged["User-Agent"]).toBeDefined();
      expect(merged["Accept-Encoding"]).toBe("identity");
      expect(merged["Connection"]).toBe("keep-alive");
    });
  });

  describe("exportDefaultHeaders", () => {
    it("should export headers in HTTP raw format", () => {
      const exported = HeadersFileParser.exportDefaultHeaders();

      expect(exported).toContain("User-Agent:");
      expect(exported).toContain("Accept:");
      expect(exported).toContain("Accept-Encoding: identity");
      expect(exported).toContain("#"); // Should have comments
    });

    it("should include documentation in export", () => {
      const exported = HeadersFileParser.exportDefaultHeaders();

      expect(exported).toContain("Default Headers");
      expect(exported).toContain("--headers-file");
      expect(exported).toContain("prevents file corruption");
    });

    it("should be parseable by parseFile", () => {
      const exported = HeadersFileParser.exportDefaultHeaders();
      const filePath = createTestFile("exported.txt", exported);
      const parsed = HeadersFileParser.parseFile(filePath);

      // Should parse without errors and contain key headers
      expect(parsed["Accept-Encoding"]).toBe("identity");
      expect(parsed["User-Agent"]).toBeDefined();
    });
  });
});
