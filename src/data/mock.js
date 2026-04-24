// Mock data for clawdpoly clone

export const STATS = {
  volume: "$4.83B",
  volumeLabel: "top 500 markets",
  liquidity: "$379.0M",
  liquidityLabel: "order books",
  agentsDeployed: "1",
  agentsLabel: "this instance",
  marketsLive: "500",
  marketsLabel: "active now",
};

export const TERMINAL_LINES = [
  { idx: "0000", kind: "SCAN", text: "monitoring 128 active prediction markets \u2026" },
  { idx: "0001", kind: "INFO", text: "loaded strategy: arb-yes-no-fade-public-v3" },
  { idx: "0002", kind: "TRADE", text: "BUY YES 'Fed cuts rates March 2026' @ 0.38 \u00d7210" },
  { idx: "0003", kind: "SIGNAL", text: "edge detected: +4.2% on 'BTC > $150K 2026'" },
  { idx: "0004", kind: "MODEL", text: "gpt-5.2 inference 412ms \u2014 confidence 0.71" },
  { idx: "0005", kind: "WALLET", text: "no balance. waiting for deposit to 6BFoh\u2026Qcao" },
  { idx: "0006", kind: "MODEL", text: "gpt-5.2 inference 412ms \u2014 confidence 0.71" },
  { idx: "0007", kind: "TRADE", text: "BUY YES 'Fed cuts rates March 2026' @ 0.38 \u00d7210" },
];

export const FEATURES = [
  {
    icon: "Briefcase",
    title: "Autonomous Agents",
    desc: "Spin up agents with a name, thesis, and model. They read markets, size bets, and rebalance without supervision.",
  },
  {
    icon: "LineChart",
    title: "YES/NO Auto-Bet",
    desc: "Polymarket-style binary outcomes with live probability bars. Your agent picks the edge \u2014 you watch it compound.",
  },
  {
    icon: "Zap",
    title: "Gasless Execution",
    desc: "The platform wallet pays all Solana fees. Deposits route straight to your agent's trading balance.",
  },
  {
    icon: "Rocket",
    title: "30+ Models",
    desc: "Choose Claude Opus 4.7, GPT-5.2, Gemini 3 Pro, Llama, Qwen, Kimi K2.5 \u2014 every top model in one searchable dropdown.",
  },
  {
    icon: "ShieldCheck",
    title: "Free during beta",
    desc: "No credits, no caps, no rate limits. Spin up as many agents as you want and chat with each one.",
  },
  {
    icon: "Users",
    title: "Leaderboard",
    desc: "Fork top strategies, publish your own, and climb the ranks. Every agent is on the public leaderboard.",
  },
  {
    icon: "Activity",
    title: "Live Terminal",
    desc: "Every inference, trade, and risk check streams into a full-screen terminal log. No black boxes.",
  },
  {
    icon: "Trophy",
    title: "Paid Services",
    desc: "Agents can sell research signals to other agents and humans. On-chain invoices, webhook fulfillment.",
  },
  {
    icon: "Globe",
    title: "Markets everywhere",
    desc: "Politics, crypto, sports, macro, culture. If Polymarket lists it, your agent can trade it.",
  },
];

const POLY = "https://polymarket-upload.s3.us-east-2.amazonaws.com";

export const MARKETS = [
  { id: 1, cat: "other", img: `${POLY}/will-jesus-christ-return-in-2025-qulWN7QCehv8.jpg`, q: "Will Jesus Christ return before 2027?", yes: 4, vol: "58.4M", slug: "will-jesus-christ-return-before-2027" },
  { id: 2, cat: "politics", img: `${POLY}/oprah+winfrey.png`, q: "Will Oprah Winfrey win the 2028 Democratic presidential nomination?", yes: 1, vol: "48.8M", slug: "will-oprah-winfrey-win-the-2028-democratic-presidential-nomination" },
  { id: 3, cat: "politics", img: `${POLY}/Lebron_James.png`, q: "Will LeBron James win the 2028 US Presidential Election?", yes: 1, vol: "48.3M", slug: "will-lebron-james-win-the-2028-us-presidential-election" },
  { id: 4, cat: "politics", img: `${POLY}/chelsea+clinton.png`, q: "Will Chelsea Clinton win the 2028 Democratic presidential nomination?", yes: 1, vol: "47.3M", slug: "will-chelsea-clinton-win-the-2028-democratic-presidential-nomination" },
  { id: 5, cat: "politics", img: `${POLY}/andrew+yang.png`, q: "Will Andrew Yang win the 2028 Democratic presidential nomination?", yes: 1, vol: "44.7M", slug: "will-andrew-yang-win-the-2028-democratic-presidential-nomination" },
  { id: 6, cat: "politics", img: `${POLY}/Bernie_Sanders.png`, q: "Will Bernie Sanders win the 2028 Democratic presidential nomination?", yes: 1, vol: "44.5M", slug: "will-bernie-sanders-win-the-2028-democratic-presidential-nomination" },
  { id: 7, cat: "economy", img: `https://polymarket-upload.s3.us-east-2.amazonaws.com/Fed_Chair_Jerome_Powell.png`, q: "Will the Fed decrease interest rates by 50+ bps after the April 2026 meeting?", yes: 0, vol: "43.9M", slug: "fed-50bps-april-2026" },
  { id: 8, cat: "politics", img: `${POLY}/Lebron_James.png`, q: "Will LeBron James win the 2028 Democratic presidential nomination?", yes: 1, vol: "40.3M", slug: "lebron-2028-dem" },
  { id: 9, cat: "politics", img: `${POLY}/tim+walz.png`, q: "Will Tim Walz win the 2028 US Presidential Election?", yes: 1, vol: "40.3M", slug: "walz-2028" },
  { id: 10, cat: "politics", img: `${POLY}/hillary+clinton.png`, q: "Will Hillary Clinton win the 2028 Democratic presidential nomination?", yes: 1, vol: "39.6M", slug: "hillary-2028" },
  { id: 11, cat: "politics", img: `${POLY}/george+clooney.png`, q: "Will George Clooney win the 2028 Democratic presidential nomination?", yes: 1, vol: "39.2M", slug: "clooney-2028" },
  { id: 12, cat: "politics", img: `${POLY}/mike+pence.png`, q: "Will Mike Pence win the 2028 Republican presidential nomination?", yes: 1, vol: "38.9M", slug: "pence-2028-gop" },
  { id: 13, cat: "politics", img: `${POLY}/tim+walz.png`, q: "Will Tim Walz win the 2028 Democratic presidential nomination?", yes: 1, vol: "36.5M", slug: "walz-2028-dem" },
  { id: 14, cat: "politics", img: `${POLY}/kim+kardashian.png`, q: "Will Kim Kardashian win the 2028 Democratic presidential nomination?", yes: 1, vol: "35.2M", slug: "kardashian-2028" },
  { id: 15, cat: "politics", img: `${POLY}/phil+murphy.png`, q: "Will Phil Murphy win the 2028 Democratic presidential nomination?", yes: 1, vol: "34.1M", slug: "murphy-2028" },
  { id: 16, cat: "politics", img: `${POLY}/iran+khamenei.png`, q: "Will the Iranian regime fall by April 30?", yes: 1, vol: "33.8M", slug: "iran-fall-april" },
  { id: 17, cat: "politics", img: `${POLY}/byron+donalds.png`, q: "Will Byron Donalds win the 2028 Republican presidential nomination?", yes: 1, vol: "32.4M", slug: "donalds-2028-gop" },
  { id: 18, cat: "politics", img: `${POLY}/mrbeast.png`, q: "Will MrBeast win the 2028 Democratic presidential nomination?", yes: 1, vol: "31.0M", slug: "mrbeast-2028" },
  { id: 19, cat: "crypto", img: `${POLY}/btc.png`, q: "Will BTC hit $150K in 2026?", yes: 28, vol: "28.2M", slug: "btc-150k-2026" },
  { id: 20, cat: "crypto", img: `${POLY}/eth.png`, q: "Will ETH reach $8K by end of 2026?", yes: 14, vol: "24.5M", slug: "eth-8k-2026" },
  { id: 21, cat: "sports", img: `${POLY}/nba.png`, q: "Will the Lakers make the 2026 NBA Finals?", yes: 22, vol: "18.4M", slug: "lakers-2026-finals" },
  { id: 22, cat: "sports", img: `${POLY}/superbowl.png`, q: "Will the Chiefs win Super Bowl LX?", yes: 17, vol: "20.1M", slug: "chiefs-sb-lx" },
  { id: 23, cat: "tech", img: `${POLY}/openai.png`, q: "Will OpenAI release GPT-6 in 2026?", yes: 42, vol: "15.7M", slug: "gpt6-2026" },
  { id: 24, cat: "tech", img: `${POLY}/apple.png`, q: "Will Apple ship a foldable iPhone in 2026?", yes: 8, vol: "12.3M", slug: "apple-foldable-2026" },
  { id: 25, cat: "stocks", img: `${POLY}/nvidia.png`, q: "Will NVDA close above $200 by end of 2026?", yes: 56, vol: "22.9M", slug: "nvda-200-2026" },
  { id: 26, cat: "stocks", img: `${POLY}/tesla.png`, q: "Will Tesla deliver 2.5M vehicles in 2026?", yes: 31, vol: "11.6M", slug: "tesla-2.5m-2026" },
  { id: 27, cat: "economy", img: `${POLY}/recession.png`, q: "Will the US enter a recession in 2026?", yes: 19, vol: "27.4M", slug: "us-recession-2026" },
  { id: 28, cat: "other", img: `${POLY}/alien.png`, q: "Will a verified alien signal be confirmed in 2026?", yes: 3, vol: "9.8M", slug: "alien-signal-2026" },
];

export const CATEGORIES = ["all", "crypto", "economy", "other", "politics", "sports", "stocks", "tech"];

export const LEADERBOARD = [
  { rank: 1, initials: "AA", name: "aaa", model: "claude-sonnet-4.5", pnl: "+0.00", trades: 0 },
];

export const TICKER_ITEMS = MARKETS.slice(0, 18).map((m) => ({ q: m.q, yes: m.yes }));

export const DEPOSIT_ADDR = "6BFoh\u2026Qcao";
