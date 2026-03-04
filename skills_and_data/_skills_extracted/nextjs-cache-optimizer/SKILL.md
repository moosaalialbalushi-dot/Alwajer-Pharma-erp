---
name: nextjs-cache-optimizer
description: "Optimize Next.js caching and rendering strategies. Use for: implementing Partial Prerendering (PPR), configuring ISR/SSG, and optimizing data fetching cache."
---

# Next.js Cache Optimizer

This skill specializes in optimizing Next.js applications by leveraging advanced caching and rendering features to ensure maximum performance.

## Usage Guidelines

Use this skill when tasked with improving the load speed or efficiency of a Next.js application.

1. **Identify Caching Opportunities**: Analyze pages for static vs. dynamic content and suggest appropriate caching strategies (ISR, SSG, etc.).
2. **Implement Advanced Features**: Guide the implementation of Partial Prerendering (PPR) and React Server Components.
3. **Optimize Data Fetching**: Ensure proper use of the `cache()` wrapper and granular caching directives in `fetch` calls.

## Core Strategies

- **Partial Prerendering (PPR)**: Combine static shells with dynamic holes for fast initial loads.
- **Granular Caching**: Use `export const revalidate` and specific cache tags to control data freshness.
- **Server Components**: Maximize the use of Server Components to reduce client-side JavaScript and enable server-side caching.

## Examples

### Caching Audit
- **User Request**: "Review this Next.js page for caching issues."
- **Skill Action**: Identify missing `revalidate` constants or opportunities to use `force-static`, and provide the necessary code changes.

### Performance Optimization
- **User Request**: "Optimize my Next.js app for performance."
- **Skill Action**: Suggest splitting pages into cached components and implementing PPR for dynamic sections.

## Limitations

- **Version Specific**: Best suited for recent versions of Next.js that support App Router and advanced caching features.
- **Implementation Complexity**: Requires a deep understanding of the application's data flow to avoid stale data issues.
