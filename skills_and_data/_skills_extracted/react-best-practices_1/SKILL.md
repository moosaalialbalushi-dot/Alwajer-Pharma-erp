---
name: react-best-practices
description: "Optimize React and Next.js applications using Vercel's performance wisdom. Use for: auditing React components, refactoring for performance, and enforcing Next.js best practices."
---

# React Best Practices (Vercel)

This skill encodes over 10 years of front-end performance wisdom from Vercel to help optimize React and Next.js applications.

## Usage Guidelines

Use this skill when auditing, refactoring, or building new React/Next.js projects to ensure high performance and code quality.

1. **Performance Audit**: Review components for anti-patterns like heavy re-renders, large bundle sizes, or network waterfalls.
2. **Refactoring**: Apply rules to optimize data fetching (e.g., parallel loading) and component structure.
3. **Proactive Guidance**: Use these guidelines during the development of new pages to ensure optimal patterns from the start.

## Core Rules

- **Avoid Network Waterfalls**: Load data in parallel rather than sequentially where possible.
- **Optimize Re-renders**: Use memoization and proper state management to prevent unnecessary updates.
- **Reduce Bundle Size**: Identify and eliminate heavy dependencies or unused code.
- **Next.js Optimization**: Leverage Next.js specific features like Server Components and optimized caching.

## Examples

### Component Audit
- **User Request**: "Review this React component for performance issues."
- **Skill Action**: Analyze the code against performance rules, identify anti-patterns (e.g., sequential data fetching), and suggest fixes with code diffs.

### Proactive Development
- **User Request**: "Build a new Next.js page for a dashboard."
- **Skill Action**: Implement the page using parallel data fetching and efficient component structures as defined in the best practices.

## Limitations

- **Framework Specific**: Focused strictly on React and Next.js; not applicable to Vue, Angular, or back-end logic.
- **Complexity of Fixes**: Identifies issues, but complex refactors may still require human judgment.
- **Evolving Standards**: While extensive, it may not cover every edge case or the very latest experimental features.
