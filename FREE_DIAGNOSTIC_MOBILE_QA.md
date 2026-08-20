# Free Diagnostic — Mobile QA

| Viewport | Result | Evidence |
| --- | --- | --- |
| 360 × 800 | Pass | Full card, Arabic text, and three answer controls are visible; no horizontal clipping observed. |
| 390 × 844 | Pass | Full heading, explanatory text, question and answer controls visible after overflow containment. |
| 430 × 932 | Pass | Full card is visible with readable RTL alignment and touch-friendly answer controls. |

**Conclusion:** The anonymous diagnostic remains fully visible at the tested phone widths. The layout uses `w-full` and `overflow-x-hidden`; answer controls span the available width without a horizontal scroll path.
