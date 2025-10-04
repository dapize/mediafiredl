import { describe, expect, it } from "vitest";
import { convertToBytes } from "./convertToBytes";
import EsTranslation from "../../i18n/locales/es.json" with { type: "json" };

describe("convertToBytes", () => {
  it("Should return correct bytes When input is in bytes", () => {
    expect(convertToBytes("88B")).toBe(88);
  });

  it("Should return correct bytes When input is in kilobytes", () => {
    expect(convertToBytes("29.09KB")).toBeCloseTo(29788.16, 2);
  });

  it("Should return correct bytes When input is in megabytes", () => {
    expect(convertToBytes("27.87MB")).toBeCloseTo(29223813.12, 2);
  });

  it("Should return correct bytes When input is in gigabytes", () => {
    expect(convertToBytes("1.39GB")).toBeCloseTo(1492501135.36, 2);
  });

  it("Should return correct bytes When input is in terabytes", () => {
    expect(convertToBytes("2TB")).toBe(2199023255552);
  });

  it("Should handle decimals When input includes fractional values", () => {
    expect(convertToBytes("0.5KB")).toBe(512);
    expect(convertToBytes("0.001MB")).toBeCloseTo(1048.576, 2);
  });

  it("Should return correct bytes When input has varying cases in units", () => {
    expect(convertToBytes("88b")).toBe(88);
    expect(convertToBytes("29.09kB")).toBeCloseTo(29788.16, 2);
  });

  it("Should throw an error When input is invalid", () => {
    expect(() => convertToBytes("88")).toThrow(
      `${EsTranslation.errors.invalidformat}: 88`,
    );
    expect(() => convertToBytes("KB")).toThrow(
      `${EsTranslation.errors.invalidformat}: KB`,
    );
    expect(() => convertToBytes("29.09XYZ")).toThrow(
      `${EsTranslation.errors.invalidUnit}: XYZ`,
    );
  });
});
