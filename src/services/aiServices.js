const { generateWithFallback } = require('../../config/groq');

class AIRefinementService {
  constructor() {
    this.model = 'qwen/qwen3.6-27b';
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

TASKS:
- Rewrite every sentence.
- Never copy more than 8 consecutive words.
- Preserve every fact.
- Remove repeated information.
- Remove navigation text.
- Remove image captions.
- Remove copyright/footer.
- Merge short paragraphs.
- Keep professional journalism style.
- Produce smooth transitions.
- Keep chronological order.
- Keep all names, dates and numbers exactly.

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
        reasoning_effort: "none",
        messages: [
          {
            role: "system",
            content: "You are a JSON generator. Respond ONLY with valid JSON."
          },
          { role: 'user', content: prompt }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 0.1,
        max_tokens: 1500,
      });

      return completion.choices?.[0]?.message?.content || '';
    });

    if (!text) return null;

    return this.safeParseJSON(text);
  }

  safeParseJSON(text) {
    try {
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (err) {
      console.error("========== AI RAW RESPONSE ==========");
      console.log(text);
      console.error("=====================================");
      console.error(err);

      return null;
    }
  }
}

module.exports = new AIRefinementService();
