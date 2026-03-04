---
name: skill-installer
description: "Discover and install other agent skills on the fly from mcpmarket.com or GitHub. Use for: finding if a skill exists for a specific need and automatically fetching/installing it."
---

# Skill Installer & Lookup

This skill acts as a package manager for agent skills, allowing for the discovery and installation of new capabilities through natural language commands.

## Usage Guidelines

When a user requests a capability that is not currently available or asks for a specific skill to be installed, use this skill to find and set it up.

1. **Search for Skills**: Use the browser to search `mcpmarket.com`, GitHub, or other skill registries for relevant keywords.
2. **Evaluate and Install**: Report the best match to the user. If confirmed, download the skill into the local skills directory (`/home/ubuntu/skills/`).
3. **Verify Installation**: Ensure the skill's `SKILL.md` is present and follows the required format.

## Examples

### Discovering a New Skill
- **User Request**: "Is there a skill for drawing UML diagrams? If so, install it."
- **Skill Action**: Search for "UML diagram skill", find a suitable repository, and download it to the skills folder.

### Installing a Specific Tool
- **User Request**: "Get me a skill that handles Excel analysis."
- **Skill Action**: Look up "Excel analysis agent skill", identify the top-rated one, and perform the installation.

## Limitations

- **Registry Dependency**: Success depends on the availability and accuracy of skill indexes.
- **Security Risks**: Installing community skills carries risks; always review the skill's description and instructions before execution.
- **Configuration Requirements**: Some skills may require additional setup (e.g., API keys) after installation.
- **Platform Compatibility**: Only skills compatible with the current agent platform can be installed successfully.
