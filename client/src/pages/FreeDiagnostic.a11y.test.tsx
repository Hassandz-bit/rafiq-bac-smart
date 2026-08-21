// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect, describe, it, vi } from "vitest";
import FreeDiagnostic from "./FreeDiagnostic";

vi.mock("wouter", () => ({ useLocation: () => ["/diagnostic", vi.fn()] }));

describe("التشخيص المجاني — تدقيق الوصول", () => {
  it("يعرض شاشة RTL عامة بلا انتهاكات وصول آلية قابلة للكشف", async () => {
    const { container } = render(<FreeDiagnostic />);
    const results = await axe(container, { rules: { region: { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });
});
