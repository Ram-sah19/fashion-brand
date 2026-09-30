import { Request, Response, NextFunction } from "express";

let activeRequests = 0;

// Maximum number of requests the Gateway will process at once.
const MAX_ACTIVE_REQUESTS = 100;

export const loadShedding = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // If the Gateway is already overloaded,
  // reject the new request.
  if (activeRequests >= MAX_ACTIVE_REQUESTS) {
    res.status(503).json({
      message:
        "Service temporarily overloaded. Please try again later.",
    });

    return;
  }

  activeRequests++;

  // When the request finishes, reduce the active request count.
  const releaseRequest = (): void => {
    activeRequests = Math.max(0, activeRequests - 1);
  };

  res.on("finish", releaseRequest);
  res.on("close", releaseRequest);

  next();
};