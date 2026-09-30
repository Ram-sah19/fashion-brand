import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

const setupAccounts = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    // ADMIN
    const adminEmail = "admin@example.com";
    const adminPassword = "Admin@12345";

    const adminHashedPassword = await bcrypt.hash(
      adminPassword,
      12,
    );

    const admin = await User.findOne({
      email: adminEmail,
    });

    if (admin) {
      admin.password = adminHashedPassword;
      admin.role = "admin";
      admin.emailVerified = true;
      await admin.save();

      console.log("Admin account updated successfully");
    } else {
      await User.create({
        name: "Admin User",
        email: adminEmail,
        password: adminHashedPassword,
        role: "admin",
        emailVerified: true,
      });

      console.log("Admin account created successfully");
    }

    // SUPERADMIN
    const superadminEmail = "superadmin@example.com";
    const superadminPassword = "SuperAdmin@12345";

    const superadminHashedPassword = await bcrypt.hash(
      superadminPassword,
      12,
    );

    const superadmin = await User.findOne({
      email: superadminEmail,
    });

    if (superadmin) {
      superadmin.password = superadminHashedPassword;
      superadmin.role = "superadmin";
      superadmin.emailVerified = true;
      await superadmin.save();

      console.log("Superadmin account updated successfully");
    } else {
      await User.create({
        name: "Superadmin",
        email: superadminEmail,
        password: superadminHashedPassword,
        role: "superadmin",
        emailVerified: true,
      });

      console.log("Superadmin account created successfully");
    }

    await mongoose.disconnect();

    console.log("");
    console.log("Admin:");
    console.log("Email: admin@example.com");
    console.log("Password: Admin@12345");

    console.log("");
    console.log("Superadmin:");
    console.log("Email: superadmin@example.com");
    console.log("Password: SuperAdmin@12345");

    process.exit(0);
  } catch (error) {
    console.error("Setup accounts error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

setupAccounts();