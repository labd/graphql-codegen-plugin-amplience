import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    include: ["./test/**/*.test.{ts,tsx,js}"],
    globals: true,
    environment: "node",
  },
});
