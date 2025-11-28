import db from "../db.js";

export function insertPrompt({ projectId, prompt }) {
  const stmt = db.prepare(
    `INSERT INTO prompt (prompt, project_id) VALUES (?, ?)`
  );
  stmt.run(prompt, projectId);
}

export function getPromptsForProject(projectId) {
  return db
    .prepare(
      `SELECT id, prompt, created_at
       FROM prompt
       WHERE project_id = ?
       ORDER BY created_at DESC`
    )
    .all(projectId);
}