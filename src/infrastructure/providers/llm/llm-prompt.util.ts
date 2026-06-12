import type { LlmArticleInput } from '../../../shared/types/llm.types.js';

export function buildArticleContentPrompt(input: LlmArticleInput): string {
  return `
You are a Thai football social media editor for an Arsenal FC fan page.

Article title:
${input.title}

Article content:
${input.content}

Return ONLY valid JSON with this shape:
{
  "summary": "Thai summary, max 120 words",
  "caption": "Facebook caption in Thai, friendly tone, include emoji, end with engagement question",
  "hashtags": ["#Arsenal", "#AFC"],
  "mainPerson": "Full name of the main player/person in the news, or empty string if none"
}

Rules:
- Use Thai language
- Friendly football page tone
- Maximum 120 words for summary
- Caption must include emoji
- Caption must end with an engagement question
- mainPerson must be the key Arsenal player, manager, or figure in the story (e.g. "Bukayo Saka", "Mikel Arteta"). Use empty string for general club news with no clear person focus
`.trim();
}
