export type AppEnv = "development" | "staging" | "production";

export interface Config {
  port: number;
  env: AppEnv;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const appEnv = (env.APP_ENV ?? "development") as AppEnv;
  if (!["development", "staging", "production"].includes(appEnv)) {
    throw new Error(`APP_ENV must be development, staging, or production (got "${appEnv}")`);
  }
  return { port: Number(env.PORT ?? 3000), env: appEnv };
}
