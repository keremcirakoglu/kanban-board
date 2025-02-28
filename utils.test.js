import { safeJSONParse, logError } from "../utils.js";

describe("safeJSONParse", () => {
  test("should parse valid JSON", () => {
    expect(safeJSONParse('{"key":"value"}', {})).toEqual({ key: "value" });
  });
  test("should return fallback for invalid JSON", () => {
    expect(safeJSONParse("invalid", { fallback: true })).toEqual({ fallback: true });
  });
});

describe("logError", () => {
  test("should log error (use spy)", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    logError("Test error");
    expect(spy).toHaveBeenCalledWith("Error:", "Test error");
    spy.mockRestore();
  });
});
