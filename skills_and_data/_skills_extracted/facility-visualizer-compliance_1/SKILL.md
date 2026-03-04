---
name: facility-visualizer-compliance
description: "Professional visualization and regulatory compliance analysis for industrial and pharmaceutical facilities. Use for: transforming blueprints into 2D/3D models, analyzing personnel/material flow, and ensuring US FDA (21 CFR 211) or other regulatory compliance. Integrates Google Gemini for advanced layout identification."
---

# Facility Visualizer & Compliance

This skill provides a structured workflow for transforming facility blueprints into professional visualizations while ensuring regulatory compliance and optimized operational flow.

## Workflow

### 1. Layout Analysis & Identification
- **Advanced Identification**: Use the **Google Gemini API** (`GEMINI_API_KEY`) to analyze complex blueprints. Gemini is highly effective at identifying room labels, ISO classifications, and pressure differentials from scratch images.
- Identify all functional areas (storage, production, labs, admin).
- Map existing entry/exit points for personnel and materials.
- Identify "clean" vs. "dirty" zones and pressure cascades.

### 2. Regulatory Research
- For pharmaceutical facilities, refer to `references/fda_compliance_211_42.md`.
- Verify requirements for defined areas, segregation, and environmental controls.
- Check for specific industry standards (e.g., cGMP, ISO 14644).

### 3. Visualization Generation
- **2D Enhancement**: Use `generate_image` to create a clean, CAD-style architectural plan. Refer to `templates/architectural_reference.png` for the desired professional standard (including legends, ISO grades, and flow arrows).
- **3D Modeling**: Use `generate_image` with prompts for "isometric cutaway view" to show internal structure, equipment, and spatial relationships.

### 4. Flow & Compliance Reporting
- Analyze "Man and Material" movements.
- Identify potential bottlenecks or contamination risks.
- Provide operational recommendations (e.g., airlocks, gowning protocols, pressure differentials).

## Best Practices for Prompts

### 2D Layouts
- "Professional 2D architectural floor plan, CAD-style, clean lines, light gray palette, labeled rooms, flow arrows for personnel and materials. Style reference: templates/architectural_reference.png."

### 3D Models
- "3D isometric cutaway view, architectural visualization, realistic lighting, epoxy floors, stainless steel equipment, high-angle perspective."

## Tool Integration: Google Gemini
When analyzing blueprints, use the following pattern with the Gemini API:
1. Upload the blueprint image.
2. Prompt Gemini to: "Identify all rooms, their ISO classifications, pressure differentials (Pa), and the flow of materials (red arrows) and personnel (blue arrows) in this pharmaceutical facility layout."

## Resources
- `references/fda_compliance_211_42.md`: Detailed FDA 21 CFR 211.42 requirements.
- `templates/architectural_reference.png`: High-standard architectural layout example.
