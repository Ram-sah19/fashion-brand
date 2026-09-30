import { Request, Response } from "express";
import User from "../models/User";

export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.userId).select(
      "-password -__v",
    );

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const searchUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = String(req.query.q || "")
      .trim()
      .toLowerCase();

    if (!query) {
      res.status(400).json({
        message: "Search query is required",
      });
      return;
    }

    const users = await User.find({
      $or: [
        {
          name: {
            $regex: query,
            $options: "i",
          },
        },
        {
          email: {
            $regex: query,
            $options: "i",
          },
        },
      ],
    })
      .select("-password -__v")
      .limit(20);

    res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Search users error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const getAdmins = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const admins = await User.find({
      role: "admin",
    })
      .select("-password -__v")
      .sort({ createdAt: -1 });

    res.status(200).json({
      admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await User.find()
      .select("-password -__v")
      .sort({ createdAt: -1 });

    res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { role } = req.body;

    if (
      role !== "user" &&
      role !== "admin" &&
      role !== "superadmin"
    ) {
      res.status(400).json({
        message: "Invalid role",
      });
      return;
    }

    const user = await User.findById(
      req.params.userId,
    );

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    user.role = role;

    await user.save();

    const safeUser = await User.findById(
      user._id,
    ).select("-password -__v");

    res.status(200).json({
      message: "User role updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Update user role error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(
      req.params.userId,
    );

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    await User.findByIdAndDelete(
      req.params.userId,
    );

    res.status(200).json({
      message: "User removed successfully",
    });
  } catch (error) {
    console.error(
      "Delete user error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const disableAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(
      req.params.userId,
    );

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    if (user.role !== "admin") {
      res.status(400).json({
        message:
          "Only admin accounts can be disabled",
      });
      return;
    }

    user.isActive = false;

    await user.save();

    res.status(200).json({
      message: "Admin account disabled successfully",
    });
  } catch (error) {
    console.error(
      "Disable admin error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const enableAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(
      req.params.userId,
    );

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    if (user.role !== "admin") {
      res.status(400).json({
        message:
          "Only admin accounts can be enabled",
      });
      return;
    }

    user.isActive = true;

    await user.save();

    res.status(200).json({
      message: "Admin account enabled successfully",
    });
  } catch (error) {
    console.error(
      "Enable admin error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};