import { describe, expect, it } from "vitest";
import { encryptPayoutDestination } from "./partnerPayoutSecurity";

describe("partner payout destination encryption", () => {
  it("encrypts the destination and returns only a masked presentation value", () => {
    const destination = "CCP 12345678901234567890";
    const encrypted = encryptPayoutDestination("ccp", destination);
    expect(encrypted.ciphertext).not.toContain(destination);
    expect(encrypted.iv).toHaveLength(16);
    expect(encrypted.masked).toBe("•••• 7890");
  });
});
