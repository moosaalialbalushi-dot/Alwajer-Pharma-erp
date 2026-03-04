---
name: collaborative-skill-builder
description: "Guide for collaboratively creating new skills by defining scope, structuring content, and iteratively refining details with user input. Use for: developing new skills from scratch, enhancing existing skills, or formalizing complex workflows into reusable capabilities."
---

# Collaborative Skill Builder

This skill provides a structured, collaborative workflow for developing new Manus skills or enhancing existing ones. It leverages iterative feedback and progressive disclosure to ensure the created skill is comprehensive, well-organized, and directly addresses the user's needs. This process mirrors how Manus itself develops new capabilities with user guidance.

## Core Workflow for Skill Creation

The collaborative skill building process follows these key phases:

1.  **Understand User Requirements**: Begin by engaging the user to thoroughly understand the desired skill's purpose, scope, and specific functionalities. This involves asking clarifying questions and gathering concrete examples of how the skill will be used.
    *   See [references/skill-definition-questions.md](references/skill-definition-questions.md) for a guide on effective questioning.

2.  **Propose Initial Structure**: Based on the gathered requirements, propose a high-level structure for the skill, typically utilizing a progressive disclosure pattern. This includes outlining the main `SKILL.md` content and suggesting initial reference files for detailed information.

3.  **Iterative Content Development**: Collaboratively develop the skill's content. This involves:
    *   Drafting the `SKILL.md` with an overview and navigation to reference files.
    *   Creating and populating specialized reference files (`references/`) with detailed information, workflows, or technical protocols.
    *   Incorporating user feedback to refine existing content and add new sections (e.g., specific regulations, advanced technologies, utility requirements).
    *   Ensuring content adheres to best practices for technical writing, including the use of paragraphs, tables, and inline citations where appropriate.

4.  **Multi-Model Enhancement**: Leverage advanced AI models (Anthropic Claude and Google Gemini) to cross-check, expand, and refine the skill's content, particularly for SOPs, operational intelligence, and information cross-referencing.
    *   See [references/multi-model-enhancement.md](references/multi-model-enhancement.md) for detailed protocols on using Claude and Gemini
5.  **Validation and Delivery**: Once the content is developed and refined, validate the skill\'s structure and YAML frontmatter using the `skill-creator`\'s validation script. Finally, deliver the completed skill to the user.

## How to Use This Skill

To initiate the collaborative skill building process, simply describe the new skill you wish to create. The agent will then guide you through the steps outlined above, asking for your input at each stage to ensure the skill is tailored to your exact specifications. Be prepared to provide details, examples, and feedback to shape the skill effectively.
