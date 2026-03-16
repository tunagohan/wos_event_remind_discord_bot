import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ReminderSettings = {
  scheduledPostsEnabled: boolean;
  updatedAt: string | null;
};

const DEFAULT_SETTINGS: ReminderSettings = {
  scheduledPostsEnabled: true,
  updatedAt: null,
};

const SETTINGS_PATH = path.resolve(process.cwd(), ".runtime", "reminder-settings.json");

export async function readReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;

    return {
      scheduledPostsEnabled:
        typeof parsed.scheduledPostsEnabled === "boolean"
          ? parsed.scheduledPostsEnabled
          : DEFAULT_SETTINGS.scheduledPostsEnabled,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : DEFAULT_SETTINGS.updatedAt,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return DEFAULT_SETTINGS;
    throw error;
  }
}

export async function isScheduledPostsEnabled(): Promise<boolean> {
  const settings = await readReminderSettings();
  return settings.scheduledPostsEnabled;
}

export async function updateScheduledPostsEnabled(enabled: boolean): Promise<ReminderSettings> {
  const next: ReminderSettings = {
    scheduledPostsEnabled: enabled,
    updatedAt: new Date().toISOString(),
  };

  await mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await writeFile(SETTINGS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");

  return next;
}
