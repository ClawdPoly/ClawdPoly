import chalk from "chalk";
import { findDispensaries } from "./tools/find-dispensaries.js";
import { parseAddressTool } from "./tools/parse-address.js";
import { estimateOrder } from "./tools/estimate-order.js";
import { placeOrder } from "./tools/place-order.js";
import { getProductsByDispensary, dispensaries } from "./data/catalog.js";
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mask(s: string): string {
  return s.split(" ").map((w) => w[0] + "*".repeat(Math.max(0, w.length - 1))).join(" ");
}

function maskAddr(s: string): string {
  // Mask ZIP and street name, keep number + borough + state
  return s
    .replace(/\d{5}/, "*****")
    .replace(/\d+\s+\w+\s+(St|Ave|Blvd|Rd|Ln|Dr|Pl|Ct|Way)\b/, (m) => {
      const num = m.match(/^\d+/)?.[0] || "";
      const suffix = m.match(/(St|Ave|Blvd|Rd|Ln|Dr|Pl|Ct|Way)$/)?.[0] || "";
      return `${num} ***** ${suffix}`;
    });
}

export async function runDemo(opts: {
  name: string;
  address: string;
  productId: string;
  quantity: number;
}) {
  console.log();
  console.log(g("  🌿 AgentWeed x420 x402"));
  console.log(dim("     Cannabis delivery for NYC via Rent-a-Human"));
  console.log();

  await sleep(500);

  // Step 1: Name
  console.log(g("  ? ") + `What's your name? ${bold(mask(opts.name))}`);
  await sleep(300);

  // Step 2: Address
  console.log(g("  ? ") + `Delivery address: ${bold(maskAddr(opts.address))}`);
  await sleep(500);

  // Step 3: Validate
  const parsed = parseAddressTool({ address: opts.address });
  if (!parsed.success) {
    console.log(chalk.red("\n  ✗ " + (parsed.error || "Invalid address")));
    process.exit(1);
  }
  console.log(g("\n  ✓ ") + `Address: ${maskAddr(parsed.address!.formatted)}`);

  // Step 4: Find dispensaries
  const dispResult = findDispensaries({ address: opts.address });
  const matches = (dispResult as { matchingDispensaries?: Array<{ id: string; name: string; address: string }> }).matchingDispensaries || [];
  console.log(g("  ✓ ") + `${matches.length} dispensaries deliver to you`);
  await sleep(400);

  // Step 5: Show dispensaries
  console.log();
  for (const d of matches) {
    const products = getProductsByDispensary(d.id);
    const cheapest = products.length > 0 ? Math.min(...products.map((p) => p.price)) : 0;
    const selected = d.id === opts.productId.split("-").slice(0, 2).join("-")
      ? "chronic-brooklyn" // match prefix
      : "";
    console.log(dim("     ") + (d.id === "chronic-brooklyn" ? g("❯ ") : "  ") + `${d.name} — ${d.address} ${dim(`(from $${cheapest})`)}`);
  }

  // Determine dispensary from product
  const product = getProductsByDispensary("chronic-brooklyn").find((p) => p.id === opts.productId)
    || getProductsByDispensary("green-therapy").find((p) => p.id === opts.productId)
    || getProductsByDispensary("the-travel-agency").find((p) => p.id === opts.productId);

  if (!product) {
    console.log(chalk.red(`\n  ✗ Product not found: ${opts.productId}`));
    process.exit(1);
  }

  const disp = dispensaries.find((d) => d.id === product.dispensaryId)!;
  await sleep(300);

  console.log(g("\n  ? ") + `Pick a dispensary: ${bold(disp.name)}`);
  await sleep(300);

  // Step 6: Show products
  console.log();
  const products = getProductsByDispensary(product.dispensaryId);
  for (const p of products) {
    const strain = p.strain ? ` [${p.strain}]` : "";
    const marker = p.id === opts.productId ? g("❯ ") : "  ";
    console.log(dim("     ") + marker + `${p.name}${strain} — $${p.price} / ${p.unit}`);
  }
  await sleep(300);

  console.log(g("\n  ? ") + `Pick an item: ${bold(product.name)}`);
  console.log(g("  ? ") + `How many? ${bold(String(opts.quantity))}`);
  await sleep(500);

  // Step 7: Estimate
  const estimate = estimateOrder({ items: [{ productId: opts.productId, quantity: opts.quantity }] });
  if ("error" in estimate) {
    console.log(chalk.red("\n  ✗ " + estimate.error));
    process.exit(1);
  }

  console.log();
  console.log(
    box([
      bold("ORDER SUMMARY"),
      "",
      `${product.name} x${opts.quantity}` +
        " ".repeat(Math.max(1, 28 - product.name.length - String(opts.quantity).length)) +
        `$${(product.price * opts.quantity).toFixed(2)}`,
      `Runner bounty` + " ".repeat(19) + `$${estimate.deliveryFee.toFixed(2)}`,
      `Service fee` + " ".repeat(21) + `$${estimate.serviceFee.toFixed(2)}`,
      dim("─".repeat(36)),
      bold("Total") + " ".repeat(25) + bold(`$${estimate.total.toFixed(2)}`),
      "",
      `Deliver to: ${maskAddr(parsed.address!.formatted)}`,
      `Recipient: ${mask(opts.name)}`,
      `From: ${disp.name}`,
    ]),
  );
  console.log();
  await sleep(600);

  // Step 8: Post
  console.log(g("  ? ") + `Post this order to Rent-a-Human? ${bold("Yes")}`);
  await sleep(300);
  console.log(dim("     Posting bounty..."));

  const order = await placeOrder({
    items: [{ productId: opts.productId, quantity: opts.quantity }],
    deliveryAddress: opts.address,
    customerName: opts.name,
    autoPost: true,
  });

  if ("error" in order) {
    console.log(chalk.red("\n  ✗ " + order.error));
    process.exit(1);
  }

  const rah = order.rentahuman as { success?: boolean; bountyId?: string; bountyUrl?: string; depositUrl?: string } | undefined;

  if (rah?.success) {
    console.log(g("\n  ✓ ") + `Bounty posted! ID: ${bold(rah.bountyId || "")}`);
    if (rah.bountyUrl) {
      console.log(dim(`    View: ${rah.bountyUrl}`));
    }

    if (rah.depositUrl) {
      console.log(g("\n  💳 ") + `Pay $${(order.pricing as { totalUSDC: number }).totalUSDC} escrow to make it live:`);
      console.log(dim(`     ${rah.depositUrl.slice(0, 80)}...`));
    }

    console.log(g("\n  🎉 Done! ") + "Track your order:");
    console.log(dim(`     agentweed track ${rah.bountyId}`));
  } else {
    console.log(chalk.yellow("\n  ⚠ ") + "Bounty post issue:");
    if (rah) console.log(dim(`    ${JSON.stringify(rah)}`));
  }

  console.log(dim("\n     Happy 4/20! 🌿\n"));
}
