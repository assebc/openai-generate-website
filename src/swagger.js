export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "AI Site Builder API",
    version: "1.0.0",
    description:
      "API for generating React + Tailwind pages and storing users, projects, and prompts.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local dev server",
    },
    {
      url: "https://our-brand-api.vercel.app",
      description: "Prod server"
    },
  ],
  components: {
    schemas: {
      CreateUserRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          password: { type: "string" },
        },
        required: ["name", "email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string" },
          password: { type: "string" },
        },
        required: ["email", "password"],
      },
      GeneratePageRequest: {
        type: "object",
        properties: {
          userId: { type: "integer" },
          projectId: { type: "integer", nullable: true },
          projectName: { type: "string", nullable: true },
          prompt: { type: "string" },
        },
        required: ["userId", "prompt"],
      },
      DeleteProjectRequest: {
        type: "object",
        properties: {
          userId: { type: "integer" },
          projectId: { type: "integer" },
        },
        required: ["userId", "projectId"],
      },
      ProjectSummary: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
      },
      PromptEntry: {
        type: "object",
        properties: {
          id: { type: "integer" },
          prompt: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/api/users": {
      post: {
        summary: "Create user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: { type: "integer" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid data or email already used",
          },
        },
      },
    },

    "/api/login": {
      post: {
        summary: "Login user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: { type: "integer" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid input" },
          401: { description: "Invalid credentials" },
        },
      },
    },

    "/api/logout": {
      post: {
        summary: "Logout user",
        tags: ["Auth"],
        responses: {
          200: {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/user/delete": {
      delete: {
        summary: "Delete user",
        tags: ["Auth"],
        response: {
          200: {
            description: "User deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/api/projects": {
      get: {
        summary: "Get projects for a user",
        tags: ["Projects"],
        parameters: [
          {
            name: "userId",
            in: "query",
            required: true,
            schema: { type: "integer" },
            description: "User ID",
          },
        ],
        responses: {
          200: {
            description: "List of projects",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    projects: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ProjectSummary" },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid userId" },
          404: { description: "User not found" },
        },
      },
    },

    "/api/project": {
      get: {
        summary: "Get project details (react/html) + prompts",
        tags: ["Projects"],
        parameters: [
          {
            name: "userId",
            in: "query",
            required: true,
            schema: { type: "integer" },
            description: "User ID",
          },
          {
            name: "projectId",
            in: "query",
            required: true,
            schema: { type: "integer" },
            description: "Project ID",
          },
        ],
        responses: {
          200: {
            description: "Project with prompts and generated code",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    project: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        name: { type: "string" },
                        react_code: { type: "string" },
                        html_code: { type: "string" },
                      },
                    },
                    prompts: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PromptEntry" },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid userId or projectId" },
          404: { description: "User or project not found" },
        },
      },

      delete: {
        summary: "Delete project",
        tags: ["Projects"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DeleteProjectRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Project deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid userId or projectId" },
          404: { description: "User or project not found" },
        },
      },
    },

    "/api/generate-page": {
      post: {
        summary:
          "Generate React + HTML for a project (create or update project, save prompt)",
        tags: ["Generation"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneratePageRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Generated code for project",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    projectId: { type: "integer" },
                    html: { type: "string" },
                    react: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid payload or project limit reached" },
          404: { description: "User or project not found" },
          500: { description: "LLM / server error" },
        },
      },
    },
  },
};
