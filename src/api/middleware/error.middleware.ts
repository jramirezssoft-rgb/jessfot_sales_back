import type { ErrorRequestHandler } from "express";
import { ConflictError } from "../../shared/errors.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  console.error(error);

  if (error instanceof ConflictError) {
    response.status(409).json({ message: error.message });
    return;
  }

  response.status(500).json({
    error: "Internal server error",
  });
};
