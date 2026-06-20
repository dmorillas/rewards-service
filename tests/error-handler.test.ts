import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../src/errors/errors.js";
import { errorHandler } from "../src/middlewares/error.handler.js";

function makeResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

const request = {} as Request;
const next = vi.fn() as unknown as NextFunction;

describe("errorHandler", () => {
  it("uses the HttpError status and message", () => {
    const response = makeResponse();

    errorHandler(new NotFoundError("missing"), request, response, next);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: "missing" });
  });

  it("returns a 500 for unexpected errors", () => {
    const response = makeResponse();

    errorHandler(new Error("boom"), request, response, next);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      message: "Internal Server Error",
      description: "boom",
    });
  });

  it("returns a 500 for non-Error throws", () => {
    const response = makeResponse();

    errorHandler("boom", request, response, next);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      message: "Internal Server Error",
      description: "Unknown error",
    });
  });
});
