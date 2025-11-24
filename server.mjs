import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fs from "fs/promises";

const app = express();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY is not set in your environment.");
}

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/api/generate-site", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'prompt' field" });
    }

    const response = await client.responses.create({
      // Higher-quality model for design aesthetics
      model: "gpt-4.1",
      max_output_tokens: 8000,
      instructions:
        [
          "You are a senior product designer + front-end developer.",
          "You generate a COMPLETE HTML5 page plus a separate CSS stylesheet.",
          "Return ONLY a valid JSON object with two string fields: \"html\" and \"css\".",
          "No markdown, no backticks, no explanations, no comments.",
          "",
          "VISUAL STYLE REQUIREMENTS:",
          "- Modern, premium SaaS-like aesthetic.",
          "- Use a clear visual hierarchy: big hero section, bold headline, subcopy, primary CTA.",
          "- Use CSS variables for the color palette (:root { --bg: ...; --accent: ...; }).",
          "- Use a soft gradient or subtle background for the main page (no harsh colors).",
          "- Use plenty of white space, rounded corners, and soft box-shadows.",
          "- Use a clean, system-safe font stack (e.g., 'system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif').",
          "- Add hover states for buttons and cards (transform: translateY(-2px); box-shadow changes).",
          "- Add small transitions (transition: all 180ms ease-out).",
          "- Layouts should be fully responsive using flexbox and CSS grid.",
          "",
          "HTML REQUIREMENTS:",
          "- The `html` MUST reference the stylesheet using:",
          "  <link rel=\"stylesheet\" href=\"styles.css\"> inside <head>.",
          "- Use semantic elements: <header>, <main>, <section>, <nav>, <footer>, etc.",
          "- Include a hero section and at least one content section with cards or feature blocks.",
          "",
          "CSS REQUIREMENTS:",
          "- The `css` must be valid standalone CSS and must start with rules for the html element.",
          "- Define a color system using :root variables.",
          "- Implement responsive layout: wrap, stack, or reflow on small screens using @media queries.",
          "- No CSS comments. Keep it tight but readable (line breaks OK, avoid huge blank areas).",
          "",
          "GENERAL RESTRICTIONS:",
          "- Do NOT include any <script> tag.",
          "- Do NOT include any external network requests (no remote fonts, no CDNs).",
        ].join("\n"),
      input: [
        {
          role: "user",
          content:
            [
              "Create a visually polished, responsive single-page website with semantic HTML based on this description:",
              prompt,
              "",
              "Additional requirements:",
              "- HTML must include <!DOCTYPE html>, <html>, <head>, and <body>.",
              "- Use only relative paths (e.g., styles.css) for referenced assets.",
              "- Design should feel cohesive and well thought out, not like a basic boilerplate.",
              "- Prefer a centered layout with comfortable max-width for content.",
            ].join("\n"),
        },
      ],
    });

    const raw = response.output_text;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse model output as JSON:", raw);
      return res.status(500).json({
        error: "Model did not return valid JSON with 'html' and 'css'.",
      });
    }

    const { html, css } = parsed || {};

    if (typeof html !== "string" || typeof css !== "string") {
      return res.status(500).json({
        error: "Model JSON missing 'html' or 'css' string fields.",
      });
    }

    // Compile HTML + CSS together (inline <style>) so it always renders styled
    let compiledHtml;

    if (/<\/head>/i.test(html)) {
      compiledHtml = html.replace(
        /<\/head>/i,
        `  <style>\n${css}\n  </style>\n</head>`
      );
    } else {
      compiledHtml = html.replace(
        /<!DOCTYPE html>/i,
        `<!DOCTYPE html>\n<style>\n${css}\n</style>\n`
      );
    }

    // Also keep separate files on disk
    const outDir = "public/generated";
    await fs.mkdir(outDir, { recursive: true });

    const htmlPath = `${outDir}/index.html`;
    const cssPath = `${outDir}/styles.css`;

    await Promise.all([
      fs.writeFile(htmlPath, compiledHtml, "utf8"),
      fs.writeFile(cssPath, css, "utf8"),
    ]);

    res.json({
      html: compiledHtml, // with inline <style>
      css,
      files: {
        html: "/generated/index.html",
        css: "/generated/styles.css",
      },
    });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI site builder server running at http://localhost:${PORT}`);
});
