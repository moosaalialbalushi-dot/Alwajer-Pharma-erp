# Identified Issues in Alwajer Pharma ERP

## 1. Storage & Persistence
- **Issue**: Application relies heavily on `localStorage` for API keys and dashboard configurations.
- **Issue**: Supabase client uses a mock when credentials are missing, but doesn't handle real data persistence for core ERP entities (Batches, Inventory, etc.) effectively.
- **Issue**: Core data (INITIAL_DATA) is hardcoded and resets on refresh unless manually synced with Supabase.
- **Requirement**: "It's not storing well" - needs proper database integration for all entities.

## 2. AI Functionality
- **Issue**: `geminiService.ts` uses hardcoded model names like `gemini-3-pro-preview` which might not be valid or stable.
- **Issue**: Prompting is basic and doesn't support complex file filtering or data extraction into the system's state.
- **Issue**: File analysis only returns text and doesn't "filter" or "import" data into the Handled hand.
- **Requirement**: "AI functionality is not that much great", "AI can filter my import file".

## 3. File Handling (Import/Export)
- **Issue**: File upload only analyzes content but doesn't update the ERP state (e.g., adding inventory from an Excel/CSV).
- **Issue**: No export functionality for data to be used "in hand" (Excel/CSV export).
- **Requirement**: "drop a pictures or excels or any file where the AI can filter my import file", "export the files as a data to be functioned in my hand".

## 4. UI/UX & Alignment
- **Issue**: `index.html` has `overflow: hidden` on body, and `App.tsx` has `h-[calc(100vh-140px)]` or similar fixed heights which can break on different screen sizes.
- **Issue**: Sidebar and Main content area scrolling might conflict.
- **Issue**: "sizes and the alignment of the application is not that much great where I cannot go roll up" - indicates scrolling issues and layout breakage.
- **Requirement**: Fix sizing, alignment, and "roll up" (scrolling).

## 5. Deployment
- **Issue**: Not currently deployed.
- **Requirement**: "need my system to be functioning and deployed 100%".
