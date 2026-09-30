import { Request, Response } from "express";
import Circle from "../models/Circle";

export const getCircleMemberIds =
  async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const internalSecret =
        process.env.INTERNAL_SERVICE_SECRET;

      const requestSecret =
        req.headers[
          "x-internal-service-secret"
        ];

      if (
        !internalSecret ||
        requestSecret !==
          internalSecret
      ) {
        res.status(403).json({
          message:
            "Internal service access denied",
        });
        return;
      }

      const circleId =
        req.params.circleId as string;

      const circle =
        await Circle.findById(
          circleId,
        ).select("members");

      if (!circle) {
        res.status(404).json({
          message:
            "Circle not found",
        });
        return;
      }

      res.status(200).json({
        members:
          circle.members.map(
            (memberId) =>
              memberId.toString(),
          ),
      });
    } catch (error) {
      console.error(
        "Get Circle member IDs error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };