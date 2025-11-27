import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Site Builder API",
      version: "1.0.0",
      description: "API for generating AI-designed React + Tailwind pages.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local dev server",
      },
    ],
  },
  apis: ["./src/server.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
