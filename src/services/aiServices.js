const { generateWithFallback } = require('../../config/groq');

class AIRefinementService {
  constructor() {
    this.model = 'llama-3.1-8b-instant';
  }

  async refineArticle({ title, content, source }) {
    if (!content || content.length < 200) return null;

    const prompt = `
You are a professional Muslim-world news editor.

STRICT RULES:
- Output JSON ONLY
- No markdown
- No explanations
- No commentary
- No extra text

TASK:
- Rewrite the article in clear, professional news language
- Preserve ALL original facts
- Remove fluff, repetition, navigation text
- Add brief factual background ONLY if well-known and verifiable
- Keep neutral tone
- DO NOT invent names, numbers, quotes, or events

OUTPUT JSON FORMAT:
{
  "refined_title": "",
  "refined_content": "",
  "key_facts": [],
  "background_context": ""
}

SOURCE: ${source.name}

ORIGINAL TITLE:
${title}

ORIGINAL CONTENT:
${content}
`;

    const text = await generateWithFallback(async (client) => {
      const completion = await client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 700,
      });

      return completion.choices?.[0]?.message?.content || '';
    });

    if (!text) return null;

    return this.safeParseJSON(text);
  }

  safeParseJSON(text) {
    try {
      // Remove markdown fences if model ignores instructions
      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error('❌ AI JSON parse failed');
      return null;
    }
  }
}

module.exports = new AIRefinementService();
