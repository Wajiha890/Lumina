import { createSequelize, defineModels, syncAndSeed } from "./db.js";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 5000;

async function main() {
  const sequelize = createSequelize();
  const models = defineModels(sequelize);
  await syncAndSeed(sequelize, models);
  const app = createApp(sequelize, models);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Lumina API listening on http://0.0.0.0:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
