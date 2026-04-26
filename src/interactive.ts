import { input, select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { findDispensaries } from "./tools/find-dispensaries.js";
import { parseAddressTool } from "./tools/parse-address.js";
import { estimateOrder } from "./tools/estimate-order.js";
import { placeOrder } from "./tools/place-order.js";
import { getProductsByDispensary, dispensaries } from "./data/catalog.js";
import { exec } from "child_process";
import "dotenv/config";

const g = chalk.hex("#14f195");
const dim = chalk.dim;
const bold = chalk.bold;

function box(lines: string[]) {
  const maxLen = Math.max(...lines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, "").length));
  const top = g("╭" + "─".repeat(maxLen + 4) + "╮");
  const bot = g("╰" + "─".repeat(maxLen + 4) + "╯");
  const padded = lines.map((l) => {
    const visible = l.replace(/\x1b\[[0-9;]*m/g, "").length;
    return g("│") + "  " + l + " ".repeat(maxLen - visible) + "  " + g("│");
  });
  return [top, ...padded, bot].join("\n");
}

export async function run() {
  console.log();
  console.log(g("  🌿 AgentWeed x420 x402"));
  console.log(dim("     Cannabis delivery for NYC via Rent-a-Human"));
  console.log();

  // Step 1: Name
  const name = await input({
    message: "What's your name?",
    required: true,
  });

  // Step 2: Address
  const address = await input({
    message: "Delivery address (or Google Maps link):",
    required: true,
  });

  // Step 3: Validate
  const parsed = parseAddressTool({ address });
  if (!parsed.success) {
    console.log(chalk.red("\n  ✗ " + (parsed.error || "Invalid address")));
    process.exit(1);
  }
  console.log(g("\n  ✓ ") + `Address: ${parsed.address!.formatted}`);

  // Step 4: Find dispensaries
  const dispResult = findDispensaries({ address });
  const matches = (dispResult as { matchingDispensaries?: Array<{ id: string; name: string; address: string }> }).matchingDispensaries || [];

  if (matches.length === 0) {
    console.log(chalk.red("  ✗ No dispensaries deliver to this address."));
    process.exit(1);
  }
  console.log(g("  ✓ ") + `${matches.length} dispensaries deliver to you\n`);

  // Step 5: Pick dispensary
  const dispensaryChoices = matches.map((d) => {
    const products = getProductsByDispensary(d.id);
    const cheapest = products.length > 0 ? Math.min(...products.map((p) => p.price)) : 0;
    return {
      name: `${d.name} — ${d.address} ${dim(`(from $${cheapest})`)}`,
      value: d.id,
    };
  });

  const dispensaryId = await select({
    message: "Pick a dispensary:",
    choices: dispensaryChoices,
  });

  // Step 6: Pick item
  const products = getProductsByDispensary(dispensaryId);
  const productChoices = products.map((p) => {
    const strain = p.strain ? ` [${p.strain}]` : "";
    return {
      name: `${p.name}${strain} — $${p.price} / ${p.unit}  ${dim(p.description.slice(0, 50))}`,
      value: p.id,
    };
  });

  const productId = await select({
    message: "Pick an item:",
    choices: productChoices,
  });

  // Step 7: Quantity
  const qtyStr = await input({
    message: "How many?",
    default: "1",
  });
  const quantity = parseInt(qtyStr, 10) || 1;

  // Step 8: Estimate
  const estimate = estimateOrder({ items: [{ productId, quantity }] });
  if ("error" in estimate) {
    console.log(chalk.red("\n  ✗ " + estimate.error));
    process.exit(1);
  }

  const selectedProduct = products.find((p) => p.id === productId)!;
  const disp = dispensaries.find((d) => d.id === dispensaryId)!;

  console.log();
  console.log(
    box([
      bold("ORDER SUMMARY"),
      "",
      `${selectedProduct.name} x${quantity}` +
        " ".repeat(Math.max(1, 28 - selectedProduct.name.length - String(quantity).length)) +
        `$${(selectedProduct.price * quantity).toFixed(2)}`,
      `Runner bounty` + " ".repeat(19) + `$${estimate.deliveryFee.toFixed(2)}`,
      `Service fee` + " ".repeat(21) + `$${estimate.serviceFee.toFixed(2)}`,
      dim("─".repeat(36)),
      bold("Total") + " ".repeat(25) + bold(`$${estimate.total.toFixed(2)}`),
      "",
      `Deliver to: ${parsed.address!.formatted}`,
      `Recipient: ${name}`,
      `From: ${disp.name}`,
    ]),
  );
  console.log();

  // Step 9: Post?
  const hasKey = !!process.env.RENTAHUMAN_API_KEY;
  if (!hasKey) {
    console.log(dim("  Set RENTAHUMAN_API_KEY in .env to auto-post bounties."));
    console.log(dim("  Get one at rentahuman.ai/account\n"));
  }

  const shouldPost = hasKey
    ? await confirm({ message: "Post this order to Rent-a-Human?", default: true })
    : false;

  // Step 10: Place order
  const order = await placeOrder({
    items: [{ productId, quantity }],
    deliveryAddress: address,
    customerName: name,
    autoPost: shouldPost,
  });

  if ("error" in order) {
    console.log(chalk.red("\n  ✗ " + order.error));
    process.exit(1);
  }

  const rah = order.rentahuman as { success?: boolean; bountyId?: string; bountyUrl?: string; depositUrl?: string } | undefined;

  if (shouldPost && rah?.success) {
    console.log(g("\n  ✓ ") + `Bounty posted! ID: ${bold(rah.bountyId || "")}`);
    if (rah.bountyUrl) {
      console.log(dim(`    View: ${rah.bountyUrl}`));
    }

    if (rah.depositUrl) {
      console.log(g("\n  💳 ") + `Pay $${(order.pricing as { totalUSDC: number }).totalUSDC} escrow to make it live:`);
      console.log(dim(`     ${rah.depositUrl.slice(0, 80)}...`));

      const shouldOpen = await confirm({ message: "Open payment link?", default: true });
      if (shouldOpen) {
        const url = rah.depositUrl;
        const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
        exec(`${cmd} "${url}"`);
      }
    }

    console.log(g("\n  🎉 Done! ") + "Track your order:");
    console.log(dim(`     agentweed track ${rah.bountyId}`));
  } else if (!shouldPost) {
    console.log(g("\n  ✓ ") + "Order ready! Bounty details generated.");
    console.log(dim("    Use --post flag or set RENTAHUMAN_API_KEY to post automatically."));
  } else {
    console.log(chalk.yellow("\n  ⚠ ") + "Bounty post failed.");
    if (rah && "error" in rah) {
      console.log(dim(`    ${(rah as { error: string }).error}`));
    }
  }

  console.log(dim("\n     Happy 4/20! 🌿\n"));
}
