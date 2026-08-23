import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export function MathBlock({ expression, block = false }: { expression: string; block?: boolean }) {
  const html = katex.renderToString(expression, { displayMode: block, throwOnError: false, strict: "warn" });
  return <span dir="ltr" className={block ? "block overflow-x-auto py-2 text-center" : "inline-block"} dangerouslySetInnerHTML={{ __html: html }} />;
}
