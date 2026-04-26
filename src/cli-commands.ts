import { Command } from "commander";
import chalk from "chalk";
import { browseMenu } from "./tools/browse-menu.js";
import { findDispensaries } from "./tools/find-dispensaries.js";
import { parseAddressTool } from "./tools/parse-address.js";
import { estimateOrder } from "./tools/estimate-order.js";
import { placeOrder } from "./tools/place-order.js";
import { paymentInfo } from "./tools/payment-info.js";
import { getBountyStatus } from "./lib/rentahuman-api.js";
import "dotenv/config";

const green = chalk.hex("#14f195");
const dim = chalk.dim;

export function runCli() {
  const program = new Command()
    .name("agentweed")
    .description(green("AgentWeed x420 x402") + " — Cannabis delivery for NYC via Rent-a-Human")
    .version("1.0.0");

  program
    .command("menu")
    .description("Browse the product catalog")
    .option("-d, --dispensary <id>", "Filter by dispensary ID")
    .option("-c, --category <type>", "Filter: flower, edible, vape, preroll, concentrate")
    .option("-s, --strain <type>", "Filter: indica, sativa, hybrid")
    .option("-p, --max-price <price>", "Max price in USD", parseFloat)
    .action((opts) => {
      const result = browseMenu({
        dispensaryId: opts.dispensary,
        category: opts.category,
        strain: opts.strain,
        maxPrice: opts.maxPrice,
      });
      console.log();
      console.log(green("=== AgentWeed Menu ==="));
      console.log(dim(`${result.totalProducts} products from ${result.dispensaryCount} dispensaries`));
      console.log();
      console.log(result.menu);
      console.log();
    });

  program
    .command("dispensaries")
    .description("Find dispensaries that deliver to an address")
    .argument("<address>", "NYC delivery address")
    .action((address) => {
      const result = findDispensaries({ address });
      console.log();
      console.log(green("=== Dispensary Lookup ==="));
      console.log(JSON.stringify(result, null, 2));
      console.log();
    });

  program
    .command("parse-address")
    .description("Parse and validate a delivery address")
    .argument("<address>", "Address text or Google Maps link")
    .action((address) => {
      const result = parseAddressTool({ address });
      console.log();
      console.log(green("=== Address ==="));
      console.log(JSON.stringify(result, null, 2));
      console.log();
    });

  program
    .command("estimate")
    .description("Estimate order total")
    .argument("<items...>", "Items as productId:quantity (e.g. cb-dragonfly-preroll:1)")
    .action((itemStrs: string[]) => {
      const items = itemStrs.map((s) => {
        const [productId, qty] = s.split(":");
        return { productId, quantity: parseInt(qty || "1", 10) };
      });
      const result = estimateOrder({ items });
      console.log();
      console.log(green("=== Order Estimate ==="));
      console.log(JSON.stringify(result, null, 2));
      console.log();
    });

  program
    .command("order")
    .description("Place a delivery order (creates Rent-a-Human bounty)")
    .argument("<address>", "NYC delivery address")
    .argument("<items...>", "Items as productId:quantity")
    .option("-n, --name <name>", "Recipient name")
    .option("--post", "Auto-post bounty to Rent-a-Human")
    .action(async (address: string, itemStrs: string[], opts) => {
      const items = itemStrs.map((s) => {
        const [productId, qty] = s.split(":");
        return { productId, quantity: parseInt(qty || "1", 10) };
      });
      const result = await placeOrder({
        items,
        deliveryAddress: address,
        customerName: opts.name,
        autoPost: opts.post || false,
      });
      console.log();
      console.log(green("=== Place Order ==="));
      console.log(JSON.stringify(result, null, 2));
      console.log();
    });

  program
    .command("track")
    .description("Track a Rent-a-Human bounty")
    .argument("<bountyId>", "Rent-a-Human bounty ID")
    .action(async (bountyId: string) => {
      const result = await getBountyStatus(bountyId);
      console.log();
      console.log(green("=== Bounty Status ==="));
      console.log(JSON.stringify(result, null, 2));
      console.log();
    });

  program
    .command("payment")
    .description("Get USDC payment instructions")
    .argument("<amount>", "Order total in USD")
    .action((amount: string) => {
      const result = paymentInfo({ orderTotalUsd: parseFloat(amount) });
      console.log();
      console.log(green("=== Payment Info ==="));
      if ("breakdown" in result) {
        console.log(result.breakdown);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
      console.log();
    });

  program
    .command("demo")
    .description("Run a live demo order (reads DEMO_NAME, DEMO_ADDRESS, DEMO_PRODUCT from .env)")
    .action(async () => {
      const { runDemo } = await import("./demo.js");
      await runDemo({
        name: process.env.DEMO_NAME || process.env.CARD_HOLDER_NAME || "Customer",
        address: process.env.DEMO_ADDRESS || "483 3rd Ave, Brooklyn, NY 11215",
        productId: process.env.DEMO_PRODUCT || "cb-dragonfly-preroll",
        quantity: 1,
      });
    });

  program.parse();
}
