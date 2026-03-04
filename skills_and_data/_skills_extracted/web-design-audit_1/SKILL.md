---
name: web-design-audit
description: "Audit web applications for UI/UX quality and accessibility. Use for: checking accessibility (ARIA, contrast), responsive design, and general UI polish."
---

# Web Design Audit Guidelines (Vercel)

This skill provides a comprehensive checklist for auditing web applications to ensure high UI/UX quality and accessibility compliance.

## Usage Guidelines

Use this skill to critique web app implementations, focusing on accessibility, responsiveness, and design consistency.

1. **Accessibility Check**: Verify ARIA labels, image alt text, color contrast, and heading structures.
2. **UX & Polish**: Audit form behaviors, focus handling, typography, and dark mode support.
3. **Responsive Audit**: Ensure layouts are mobile-friendly and use relative units (e.g., rem/em) for scalability.

## Core Guidelines

- **Accessibility**: Follow WCAG standards; ensure all interactive elements are keyboard accessible and screen-reader friendly.
- **Typography**: Use relative units for font sizes; maintain proper hierarchy and readability.
- **Forms**: Ensure all inputs have associated labels and clear error states.
- **Responsive Design**: Test across multiple breakpoints; prioritize fluid layouts over fixed widths.

## Examples

### Accessibility Audit
- **User Request**: "Review my login page for accessibility."
- **Skill Action**: Inspect the HTML/CSS for missing ARIA labels or low contrast, and provide specific recommendations for improvement.

### Design Consistency
- **User Request**: "Check if this page follows modern UI best practices."
- **Skill Action**: Evaluate the page's use of spacing, typography, and responsive behavior, flagging inconsistencies like hardcoded pixel values.

## Limitations

- **Subjective Aesthetics**: Does not judge visual "beauty" or subjective design choices; focuses on measurable standards.
- **Code Access Required**: Most effective when the agent can inspect the actual HTML/CSS code.
- **Manual Implementation**: Suggestions must be applied manually or via a coding environment.
