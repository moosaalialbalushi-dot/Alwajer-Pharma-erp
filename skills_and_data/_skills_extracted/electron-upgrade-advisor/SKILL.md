---
name: electron-upgrade-advisor
description: "Guide the process of upgrading Chromium and Node.js within Electron applications. Use for: planning Electron upgrades, handling API deprecations, and managing native module compatibility."
---

# Electron Upgrade Advisor

This skill provides a step-by-step playbook for navigating the complex process of upgrading the Chromium engine and Node.js environment within Electron applications.

## Usage Guidelines

Use this skill when maintaining or upgrading an Electron-based application to ensure a smooth transition between versions.

1. **Plan the Upgrade**: Follow a "two-phase" process for large version jumps (e.g., upgrading to an intermediate version first).
2. **Handle Deprecations**: Identify and resolve API changes or removed features in the new Chromium/Electron version.
3. **Manage Native Modules**: Audit and update native dependencies that may be affected by changes in the V8 engine or Node.js version.

## Core Workflow

- **Phase 1: Preparation**: Update Electron to the target version in `package.json` and identify immediate breaking changes.
- **Phase 2: Implementation**: Resolve API deprecations, update build flags, and recompile native modules.
- **Phase 3: Verification**: Run comprehensive tests to catch subtle behavior changes in the embedded browser.

## Examples

### Upgrade Planning
- **User Request**: "Help upgrade our Electron app from Chrome 100 to 110."
- **Skill Action**: Outline the necessary Electron version jumps, list known API changes, and provide a checklist for updating native modules.

### Troubleshooting
- **User Request**: "Audit what's needed to update Electron."
- **Skill Action**: Review the current version, list replaced functions, and suggest updates to the build toolchain.

## Limitations

- **App Specificity**: May not account for highly custom native modules or non-standard hacks.
- **Version Variance**: Steps may vary significantly depending on the specific version jump; always cross-reference with official Electron release notes.
- **Testing Requirement**: Cannot guarantee behavior consistency; thorough manual and automated testing is always required after an upgrade.
