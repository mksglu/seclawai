export interface TemplateManifest {
  id: string;
  name: string;
  description: string;
  price: number;
  tier: "free" | "paid";
  hook: string;
}

export interface TemplateConfig {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  tools: {
    "desktop-commander"?: boolean;
    composio?: string[];
  };
}

export interface Schedule {
  cron: string;
  action: string;
}

export interface TemplateSchedules {
  schedules: Schedule[];
  actions: Record<string, unknown>;
}
