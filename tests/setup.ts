process.env.NODE_ENV = "test";
process.env.PORT = "5001";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/store_test";
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD_HASH =
  "scrypt$ZawGY1fHXFjJsdHD-66Etw$Mz8ocETti6GjPurBMCOGp1iSuaNiEWVmqVon9I5YgQPN3KSTyaZ4kgpTG29zxVfYwVGXiJclv8CnaErtfLjuBQ";
process.env.ADMIN_TOKEN_SECRET = "test-secret-with-at-least-32-characters-long";
process.env.ADMIN_TOKEN_TTL_SECONDS = "3600";

import mongoose from "mongoose";

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key]!.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});