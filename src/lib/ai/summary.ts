import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Generate a ~200-word summary for a blog post using Google Gemini.
 *
 * Cost-optimisation notes:
 *  - We use `gemini-2.5-flash-lite` (free tier, fastest, cheapest).
 *  - We truncate the body to ~4000 chars before sending — summaries don't
 *    need the full text for context, and this caps token usage per call.
 *  - The caller ensures this is invoked exactly ONCE per post (at create time),
 *    and the result is persisted to Postgres. Listing pages read the stored
 *    `summary` column and NEVER re-hit the API.
 */
export async function generateSummary(
  title: string,
  body: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    // Graceful fallback — avoids breaking post creation in dev.
    return body.slice(0, 400).replace(/\s+\S*$/, "") + "…";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  // Cap body length to control token spend.
  const trimmed = body.length > 4000 ? body.slice(0, 4000) : body;

  const prompt = [
    "You are a concise editor. Summarise the following blog post in approximately",
    "200 words. Preserve the author's voice and key points. Output plain prose,",
    "no headings, no lists, no preface like 'This post'.",
    "",
    `TITLE: ${title}`,
    "",
    "BODY:",
    trimmed,
  ].join("\n");

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 320, // ~200 words
      },
    });
    const text = result.response.text().trim();
    return text || body.slice(0, 400) + "…";
  } catch (err) {
    console.error("[generateSummary] Gemini failed:", err);
    // Fallback so post creation never breaks because of summariser.
    return body.slice(0, 400).replace(/\s+\S*$/, "") + "…";
  }
}
