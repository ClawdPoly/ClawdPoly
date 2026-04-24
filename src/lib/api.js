import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export const login = () => {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const redirectUrl = window.location.origin + "/dashboard";
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
};

export const apiAuth = {
  me: () => api.get("/auth/me").then((r) => r.data),
  session: (session_id) => api.post("/auth/session", { session_id }).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  phantomChallenge: (pubkey) => api.post("/auth/phantom/challenge", { pubkey }).then((r) => r.data),
  phantomVerify: (pubkey, signature, nonce) =>
    api.post("/auth/phantom/verify", { pubkey, signature, nonce }).then((r) => r.data),
};

export const apiMarkets = {
  list: (params = {}) => api.get("/markets", { params }).then((r) => r.data),
  stats: () => api.get("/stats").then((r) => r.data),
};

export const apiModels = {
  list: () => api.get("/models").then((r) => r.data),
};

export const apiAgents = {
  list: () => api.get("/agents").then((r) => r.data),
  get: (id) => api.get(`/agents/${id}`).then((r) => r.data),
  create: (data) => api.post("/agents", data).then((r) => r.data),
  update: (id, data) => api.patch(`/agents/${id}`, data).then((r) => r.data),
  del: (id) => api.delete(`/agents/${id}`).then((r) => r.data),
  messages: (id) => api.get(`/agents/${id}/messages`).then((r) => r.data),
  trades: (id) => api.get(`/agents/${id}/trades`).then((r) => r.data),
  chat: (id, message) => api.post(`/agents/${id}/chat`, { message }).then((r) => r.data),
  depositIntent: (id, amount) =>
    api.post(`/agents/${id}/deposit-intent`, { agent_id: id, amount }).then((r) => r.data),
  listDeposits: (id) => api.get(`/agents/${id}/deposits`).then((r) => r.data),
  withdraw: (id, amount, destination) =>
    api.post(`/agents/${id}/withdraw`, { agent_id: id, amount, destination }).then((r) => r.data),
  withdrawals: (id) => api.get(`/agents/${id}/withdrawals`).then((r) => r.data),
};

export const apiWallet = {
  funding: () => api.get("/funding").then((r) => r.data),
  status: () => api.get("/wallet/status").then((r) => r.data),
  depositStatus: (intent_id) => api.get(`/deposits/${intent_id}`).then((r) => r.data),
};

export const apiLeaderboard = {
  list: () => api.get("/leaderboard").then((r) => r.data),
};
