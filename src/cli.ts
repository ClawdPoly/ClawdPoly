#!/usr/bin/env node

// No subcommand → interactive mode
if (process.argv.length <= 2) {
  const { run } = await import("./interactive.js");
  await run();
} else {
  // Subcommand mode
  const { runCli } = await import("./cli-commands.js");
  runCli();
}
