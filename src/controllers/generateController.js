import express from "express";
import { generateForProject } from "../services/generateService.js";

const router = express.Router();

/**
 * POST /api/generate-page
 * generate-page (pass project id, prompt, user id) (returns html and react code)
 * BODY:
 * {
 *   userId: number,
 *   projectId?: number,
 *   projectName?: string,
 *   prompt: string
 * }
 */
router.post("/generate-page", async (req, res) => {
  try {
    const { userId, projectId, prompt } = req.body;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'prompt' field." });
    }

    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      return res
        .status(400)
        .json({ error: "userId must be a positive integer." });
    }

    const numericProjectId =
      projectId != null ? Number(projectId) : undefined;
    if (projectId != null) {
      if (!Number.isInteger(numericProjectId) || numericProjectId <= 0) {
        return res
          .status(400)
          .json({ error: "projectId must be a positive integer when provided." });
      }
    }

    let result;
    try {
      result = await generateForProject({
        userId: numericUserId,
        projectId: numericProjectId,
        prompt,
      });
    } catch (err) {
      console.error("Generate service error:", err);
      if (err.code === "USER_NOT_FOUND") {
        return res.status(404).json({ error: "User not found." });
      }
      if (err.code === "PROJECT_NOT_FOUND") {
        return res
          .status(404)
          .json({ error: "Project not found for this user." });
      }
      if (err.code === "PROJECT_LIMIT") {
        return res
          .status(400)
          .json({ error: "User has reached the maximum of 5 projects." });
      }
      if (
        err.code === "LLM_INVALID_JSON" ||
        err.code === "LLM_MISSING_FIELDS"
      ) {
        return res.status(500).json({ error: err.message });
      }
      throw err;
    }

    res.json(result); // { projectId, html, react }
  } catch (err) {
    console.error("OpenAI or server error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

export default router;
