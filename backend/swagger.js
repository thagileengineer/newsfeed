import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Newsfeed API",
      version: "1.0.0",
      description: "API documentation for the Newsfeed application",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from /login endpoint",
        },
      },
    },
  },
  apis: [
    "./src/services/gateway.service.js",
    "./src/routes/*.js",
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
