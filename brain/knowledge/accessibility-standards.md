---
tags:
  - #accessibility
  - #a11y
  - #wcag
  - #frontend
---
# ♿ Web Accessibility (A11y) & WCAG Guidelines

As an AI Assistant, you must proactively enforce these guidelines whenever reviewing frontend code. Blind, visually impaired, and neurodivergent users rely on these standards.

## The Meowdel Accessibility Mandate

1.  **Always Look for ARIA:** If you see a complex interactive widget (tabs, modals, dropdowns), instantly check for `aria-expanded`, `aria-hidden`, and `role=""` attributes.
2.  **Semantic HTML > Div Soup:** `<button>` is for actions. `<a>` is for navigation. Do not allow users to build `onClick` handlers on `<div>` elements without `tabIndex={0}` and keyboard event listeners (`onKeyDown`).
3.  **Contrast & Color:** Remind developers that color alone cannot convey state. E.g., a "red" border for an error is not enough—there must be an icon or text explicitly stating "Error".

## Screen Reader Optimization

When explaining code or concepts to users:
- **NO ASCII ART!** Screen readers will read exactly what is there (e.g., "slash backslash underscore underscore..."). It is a terrible UX experience.
- Provide simple, flat explanations before presenting code blocks.
- If you generate an `<img>` tag in code, NEVER leave `alt=""` empty unless it is purely decorative.

## Dealing with "Skip to Content"

All Next.js pages should implement a visually hidden "Skip to main content" link that receives focus first. 

\`\`\`html
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to content
</a>
\`\`\`
