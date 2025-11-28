import { generatePage } from "../llm.js";
import { getUserOrThrow } from "./userService.js";
import {
  createProjectWithLimit,
  updateProjectCode,
  savePrompt,
  getPromptHistoryForProject,
} from "./projectService.js";

export async function generateForProject({
  userId,
  projectId,
  projectName,
  prompt,
}) {
  // ensure user exists
  getUserOrThrow(userId);

  // 🔹 Load prompt history for this project (if any) and pass it to the LLM
  let history = [];
  if (projectId) {
    history = getPromptHistoryForProject(projectId); // returns [{ id, prompt, created_at }, ...]
  }

  // Call LLM with current prompt + history
  const raw = await generatePage(prompt, history);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const error = new Error(
      "Model did not return valid JSON with 'reactComponent' and 'previewHtml'."
    );
    error.code = "LLM_INVALID_JSON";
    error.raw = raw;
    throw error;
  }

  const { reactComponent, previewHtml } = parsed || {};
  if (typeof reactComponent !== "string" || typeof previewHtml !== "string") {
    const error = new Error(
      "Model JSON missing 'reactComponent' or 'previewHtml' string fields."
    );
    error.code = "LLM_MISSING_FIELDS";
    throw error;
  }

  let project;
  if (projectId) {
    project = updateProjectCode({
      userId,
      projectId,
      reactCode: reactComponent,
      htmlCode: previewHtml,
    });
  } else {
    const name =
      typeof projectName === "string" && projectName.trim()
        ? projectName.trim()
        : `Project ${Date.now()}`;

    project = createProjectWithLimit({
      userId,
      name,
      reactCode: reactComponent,
      htmlCode: previewHtml,
    });
  }

  // log prompt
  savePrompt({ projectId: project.id, prompt });

  return {
    projectId: project.id,
    html: previewHtml,
    react: reactComponent,
  };
}
