
## 2026-02-09 Decision: bidi-js usage strategy
- DECISION: Do NOT apply bidi-js pre-processing by default
- REASON: Terminal already handles BiDi natively; applying bidi-js double-reverses text
- APPROACH: rtl.ts module will provide right-alignment + width utilities, with bidi-js as optional toggle
- processArabicText() will be a passthrough (identity fn) by default, with option to enable BiDi reordering
