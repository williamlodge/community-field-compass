import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createMemoryRepository, loadSampleRecords } from "./data/repository.js";

const config = loadConfig();
// The vertical slice runs on sample fixtures. A production data source is
// added in W03; createMemoryRepository refuses sample data in production.
const repo = createMemoryRepository(loadSampleRecords(), config.env);
const app = createApp(repo);

app.listen(config.port, () => {
  console.log(`FieldCompass (${config.env}) listening on http://localhost:${config.port}`);
});
