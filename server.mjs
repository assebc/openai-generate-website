import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/api/generate-site", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt' field" });
    }

    // Call OpenAI Responses API to generate a full HTML document
    const response = await client.responses.create({
      model: "gpt-5-mini",
      instructions:
        "You generate a COMPLETE HTML5 page with inline CSS in a <style> tag. " +
        "Return ONLY raw HTML, no markdown, no explanations, no comments.",
      input: [
        {
          role: "user",
          content: `Create a responsive single-file website based on this description:
${prompt}

Requirements:
- Include <!DOCTYPE html>, <html>, <head>, and <body>.
- Use modern, clean design.
- Use reduced css and always start with the html tag to avoid not loading the css.
- Do not include any script that sends network requests.`,
        },
      ],
      max_output_tokens: 4000,
    });

    const html = response.output_text;

    if (!html || typeof html !== "string") {
      return res.status(500).json({ error: "Model did not return HTML text" });
    }

    res.json({ html });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI site builder server running at http://localhost:${PORT}`);
});
