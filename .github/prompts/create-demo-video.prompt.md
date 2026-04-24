---
name: "Create NeuralShell Demo Video Package"
description: "Use when you need an agent to produce the recording package for the NeuralShell proof demo video from the existing storyboard and landing page."
argument-hint: "Optional: target length, host platform, and final video URL"
agent: "agent"
---

Create the complete production package for the NeuralShell proof demo video using the existing repository materials.

Primary source files:
- [docs/DEMO_VIDEO_STORYBOARD.md](../../docs/DEMO_VIDEO_STORYBOARD.md)
- [landing/index.html](../../landing/index.html)
- [docs/index.html](../../docs/index.html)
- [README.md](../../README.md)

Goal:
- Deliver everything needed for a human or downstream media tool to record and publish the demo video.
- Do not invent product behavior that is not documented in the repository.
- If the environment cannot render an actual video file, produce the production assets instead of stopping.

Required workflow:
1. Read the storyboard and the landing page demo section first.
2. Confirm the current product claims, UI labels, version number, and proof flow from the repo.
3. Create or update a compact video-production folder under `docs/video/`.
4. Produce a recording package that includes:
   - a shot-by-shot script for the screencast
   - a voiceover script matched to timestamps
   - on-screen text overlays and lower-third copy
   - a capture checklist with exact windows, commands, and files to show
   - a post-production checklist with title, description, chapters, and thumbnail copy
5. If a final video URL is provided in the prompt arguments, update the landing page CTA in [landing/index.html](../../landing/index.html) so "Watch Proof Demo" points to that URL.

Output requirements:
- Keep the demo focused on the proof sequence: install, create session, export backup, wipe app data, restore, verify hardware signature.
- Target a proof-style screencast, not a brand ad.
- Prefer a 2 minute cut; allow up to 3 minutes only if needed for clarity.
- Use concise, technically credible language.
- Keep all claims auditable against repository content.

Expected files to create or update:
- `docs/video/shot-list.md`
- `docs/video/voiceover-script.md`
- `docs/video/recording-checklist.md`
- `docs/video/publishing-package.md`

When finished:
- Summarize what was created.
- Call out any product claims that could not be verified from the codebase or docs.
- If no video URL was supplied, leave the landing page unchanged and state that explicitly.