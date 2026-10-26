import mongoose from "mongoose";
import envConfig from "./env";

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    console.log("MongoDB is already connected");
    return;
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(envConfig.MONGODB_URI);
    isConnected = true;
    console.log("MongoDB connected successfully");

    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to the database");
    });

    mongoose.connection.on("error", (error) => {
      console.error("Mongoose connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected from the database");
      isConnected = false;
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:");
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    console.log("No MongoDB connection to close");
    return;
  }

  try {
    console.log("Disconnecting from MongoDB...");
    await mongoose.disconnect();
    isConnected = false;
    console.log("MongoDB disconnected successfully");
  } catch (error) {
    console.error("Failed to disconnect from MongoDB:");
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
};

export const getDatabaseStatus = (): { connected: boolean; status: string } => {
  const readyState = mongoose.connection.readyState;

  const statusMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    connected: readyState === 1,
    status: statusMap[readyState] ?? "unknown",
  };
};