#!/usr/bin/env node

import { program } from "commander";
import { create } from "./commands/create.js";
import { add } from "./commands/add.js";
import { integrations } from "./commands/integrations.js";
import { templates } from "./commands/templates.js";
import { status } from "./commands/status.js";
import { stop } from "./commands/stop.js";
import { reconnect } from "./commands/reconnect.js";
import { doctor } from "./commands/doctor.js";
import { upgrade } from "./commands/upgrade.js";

program
  .name("seclaw")
  .description("Secure autonomous AI agents in 60 seconds")
  .version("0.1.0");

program
  .command("create", { isDefault: true })
  .alias("init")
  .description("Set up a new seclaw project")
  .argument("[directory]", "Project directory", ".")
  .action(create);

program
  .command("add <template>")
  .description("Add a template to your project")
  .option("--key <license>", "License key for paid templates")
  .action(add);

program
  .command("integrations")
  .description("Manage integrations (Gmail, GitHub, Notion...)")
  .action(integrations);

program
  .command("templates")
  .alias("list")
  .description("List available templates")
  .action(templates);

program
  .command("status")
  .description("Check running services")
  .action(status);

program
  .command("stop")
  .description("Stop all services")
  .action(stop);

program
  .command("reconnect")
  .description("Reconnect tunnel + Telegram webhook")
  .action(reconnect);

program
  .command("doctor")
  .description("Diagnose and fix common issues")
  .action(doctor);

program
  .command("upgrade")
  .description("Pull latest images and restart")
  .action(upgrade);

program.parse();
