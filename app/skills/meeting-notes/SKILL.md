---
name: meeting-notes
description: Transcribe audio recordings and generate structured meeting notes with action items
homepage: https://github.com/alefftech/aleff
metadata:
  moltbot:
    emoji: 🎙️
    requires:
      bins: [ffmpeg]
      env: [GROQ_API_KEY]
---

# Meeting Notes

Transcribe audio recordings and automatically generate structured meeting notes.

## Quick Start

```bash
meeting-notes <audio-file.mp3>
```

## What It Does

1. Converts audio to Whisper-compatible format (if needed)
2. Transcribes using Whisper API (Groq)
3. Analyzes transcription to extract:
   - **Topics discussed**
   - **Decisions made**
   - **Action items** (who does what)
   - **Follow-ups needed**
   - **Key quotes**

4. Outputs structured markdown notes

## Example Output

```markdown
# Meeting Notes - 2026-01-29

## Summary
Discussion about Q1 goals and project priorities.

## Topics Discussed
- Q1 revenue targets
- New client onboarding process
- Team hiring plan

## Decisions Made
- ✅ Increase marketing budget by 20%
- ✅ Hire 2 developers in February
- ✅ Launch new product in March

## Action Items
- [ ] @Melissa: Create onboarding checklist (by Feb 5)
- [ ] @Carlos: Review legal contracts (by Feb 10)
- [ ] @Ronald: Approve hiring budget (by Jan 31)

## Follow-ups
- Schedule Q2 planning meeting
- Review contractor proposals
```

## Use Cases

- **MENTORINGBASE:** Record student calls, track feedback
- **Holding meetings:** Auto-document decisions
- **Client calls:** Never miss action items
- **1-on-1s:** Track commitments

## Notes

- Supports: MP3, WAV, M4A, OGG
- Max file size: 25MB (Whisper API limit)
- Portuguese transcription supported
- Saves notes to `/tmp/meeting-notes-{timestamp}.md`
