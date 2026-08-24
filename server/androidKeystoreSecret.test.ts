import { describe, expect, it } from "vitest";

describe("Android signing secret", () => {
  it("is available to the build environment without exposing its value", () => {
    const password = process.env.ANDROID_KEYSTORE_PASSWORD;

    expect(typeof password).toBe("string");
    expect(password?.trim().length).toBeGreaterThanOrEqual(12);
  });
});
