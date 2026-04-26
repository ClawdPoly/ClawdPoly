/**
 * Launch an AI Agent: create, configure, fund, and start.
 *
 * This is the core integration pattern for platforms like OMZO
 * that want to let users launch ClawPump agents from within their app.
 *
 * Run: npx tsx examples/launch-agent.ts
 */
import { ClawpumpClient } from "@clawpump/sdk";

const client = new ClawpumpClient({
  apiKey: process.env.CLAWPUMP_API_KEY!,
  retries: 2,
});

async function launchMomentumAgent() {
  // Step 1: Create the agent with a strategy preset
  const agent = await client.createAgent({
    name: "Momentum Alpha",
    strategy: "momentum", // Auto-configures: trading + market-intelligence + sniper skills
    model: "meta-llama/llama-3.3-70b-instruct:free",
    persona:
      "Aggressive momentum trader. Focus on tokens with >$50K liquidity " +
      "and RSI < 40. Max 25% of portfolio per trade.",
  });

  console.log(`Agent created: ${agent.id}`);
  console.log(`Wallet: ${agent.walletAddress}`);
  console.log(`Skills: ${agent.skills.join(", ")}`);

  // Step 2: Fund the agent's wallet
  // Transfer SOL to agent.walletAddress via your wallet provider
  console.log(`\nFund this wallet with SOL: ${agent.walletAddress}`);
  console.log("The agent needs SOL to pay for transaction fees and trades.\n");

  // Step 3: Set up a take-profit automation
  await client.createAutomation({
    agentId: agent.id,
    name: "Emergency stop-loss",
    trigger: {
      type: "price_threshold",
      mint: "So11111111111111111111111111111111111111112", // SOL
      operator: "lte",
      priceUsd: 80, // If SOL crashes below $80
    },
    action: {
      type: "agent_prompt",
      prompt:
        "EMERGENCY: SOL dropped below $80. Immediately sell all non-stablecoin positions for USDC.",
    },
    triggerOnce: true,
  });
  console.log("Emergency stop-loss automation created.");

  // Step 4: Start the agent
  const started = await client.startAgent(agent.id);
  console.log(`Agent status: ${started.status}`); // "running"

  // Step 5: Chat with the agent
  const reply = await client.sendMessage(agent.id, {
    message: "What's your current portfolio and what are you watching?",
  });
  console.log(`\nAgent says: ${reply.content}`);

  return agent;
}

async function listMyAgents() {
  const { agents } = await client.listAgents();
  console.log(`\nYou have ${agents.length} agent(s):`);
  for (const agent of agents) {
    console.log(
      `  - ${agent.name} (${agent.status}) — wallet: ${agent.walletAddress}`,
    );
  }
}

async function main() {
  const agent = await launchMomentumAgent();
  await listMyAgents();

  // Later: stop the agent
  // await client.stopAgent(agent.id);

  // Or delete it
  // await client.deleteAgent(agent.id);
}

main().catch(console.error);
