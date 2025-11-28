import {
  getProjectsByUserIdLight,
  getProjectByIdForUser,
  countProjectsForUser,
  insertProject,
  updateProjectCodeForUser,
  deleteProjectForUser,
} from "../repositories/projectRepository.js";
import {
  insertPrompt,
  getPromptsForProject,
} from "../repositories/promptRepository.js";

export function listUserProjects(userId) {
  return getProjectsByUserIdLight(userId);
}

export function getProjectWithPrompts({ userId, projectId }) {
  const project = getProjectByIdForUser(projectId, userId);
  if (!project) {
    const err = new Error("Project not found for this user.");
    err.code = "PROJECT_NOT_FOUND";
    throw err;
  }

  const prompts = getPromptsForProject(projectId);
  return { project, prompts };
}

export function createProjectWithLimit({ userId, name, reactCode, htmlCode }) {
  const count = countProjectsForUser(userId);
  if (count >= 5) {
    const err = new Error("User has reached the maximum of 5 projects.");
    err.code = "PROJECT_LIMIT";
    throw err;
  }
  return insertProject({ userId, name, reactCode, htmlCode });
}

export function updateProjectCode({ userId, projectId, reactCode, htmlCode }) {
  const project = getProjectByIdForUser(projectId, userId);
  if (!project) {
    const err = new Error("Project not found for this user.");
    err.code = "PROJECT_NOT_FOUND";
    throw err;
  }
  return updateProjectCodeForUser({ projectId, userId, reactCode, htmlCode });
}

export function deleteProject({ userId, projectId }) {
  const deleted = deleteProjectForUser({ userId, projectId });
  if (!deleted) {
    const err = new Error("Project not found for this user.");
    err.code = "PROJECT_NOT_FOUND";
    throw err;
  }
}

export function savePrompt({ projectId, prompt }) {
  insertPrompt({ projectId, prompt });
}

export function getPromptHistoryForProject(projectId) {
  return getPromptsForProject(projectId);
}
