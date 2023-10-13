import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    include: ["./**/*.test.{ts,js}"],
    name: "plugin-json",
    environment: "node",
  },
});
