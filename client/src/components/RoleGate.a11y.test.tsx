// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect, describe, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 7, role: "content_editor" }, loading: false }),
}));

import { RoleGate } from "./RoleGate";

describe("بوابة الصلاحيات — تدقيق الوصول", () => {
  it("تعرض حالة المنع RTL بلا انتهاكات وصول آلية قابلة للكشف", async () => {
    const { container } = render(<RoleGate allowed={["student"]} title="صفحة محمية">محتوى محمي</RoleGate>);
    const results = await axe(container, { rules: { region: { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });
});
