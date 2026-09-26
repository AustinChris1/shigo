// Build-time schema sync: pushes only when DATABASE_URL is set, so a deploy without a database still builds.
import { execSync } from "child_process";

if (!process.env.DATABASE_URL) {
  console.warn("db-sync: DATABASE_URL not set, skipping prisma db push (add Neon in Vercel Storage to enable)");
  process.exit(0);
}
execSync("npx prisma db push --skip-generate --accept-data-loss", { stdio: "inherit" });
