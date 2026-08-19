export type AppRole = "admin" | "content_editor" | "academic_reviewer" | "student";

export const routeAccess: Record<string, readonly AppRole[]> = {
  "/app": ["student"],
  "/subjects": ["student"],
  "/studio": ["admin", "content_editor", "academic_reviewer"],
  "/editor": ["admin", "content_editor"],
  "/review": ["admin", "academic_reviewer"],
  "/admin": ["admin"],
};

export function canAccessPath(role: AppRole | null | undefined, path: keyof typeof routeAccess) {
  return Boolean(role && routeAccess[path].includes(role));
}
