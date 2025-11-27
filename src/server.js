import "dotenv/config";
import express from "express";
import cors from "cors";
import { generatePage } from "./llm.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Swagger UI
app.use("/swagger/index.html", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /api/generate-page:
 *   post:
 *     summary: Generate a React + Tailwind page and an HTML preview
 *     tags:
 *       - Site Generation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Description of the page you want to generate.
 *                 example: A modern SaaS dashboard landing page with hero, features grid, and pricing section.
 *             required:
 *               - prompt
 *     responses:
 *       200:
 *         description: Successfully generated page artifacts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reactComponent:
 *                   type: string
 *                   description: React + Tailwind component source code.
 *                 previewHtml:
 *                   type: string
 *                   description: Full HTML document using Tailwind CDN for visual preview.
 *               required:
 *                 - reactComponent
 *                 - previewHtml
 *       400:
 *         description: Invalid request payload.
 *       500:
 *         description: Server error while generating the page.
 */
app.post("/api/generate-page", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'prompt' field" });
    }

    const raw = await generatePage(prompt);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse model output as JSON:", raw);
      return res.status(500).json({
        error:
          "Model did not return valid JSON with 'reactComponent' and 'previewHtml'.",
      });
    }

    const { reactComponent, previewHtml } = parsed || {};

    if (
      typeof reactComponent !== "string" ||
      typeof previewHtml !== "string"
    ) {
      return res.status(500).json({
        error:
          "Model JSON missing 'reactComponent' or 'previewHtml' string fields.",
      });
    }

    res.json({ reactComponent, previewHtml });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI site builder server running at http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
