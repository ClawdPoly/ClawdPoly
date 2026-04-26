/**
 * Base error for all ClawPump SDK errors.
 */
export class ClawpumpError extends Error {
  readonly status?: number;
  readonly requestId?: string;
  readonly body?: unknown;

  constructor(
    message: string,
    opts?: { status?: number; requestId?: string; body?: unknown },
  ) {
    super(message);
    this.name = "ClawpumpError";
    this.status = opts?.status;
    this.requestId = opts?.requestId;
    this.body = opts?.body;
  }
}

/** 401 — Invalid or missing API key. */
export class AuthenticationError extends ClawpumpError {
  constructor(message: string, opts?: { requestId?: string; body?: unknown }) {
    super(message, { status: 401, ...opts });
    this.name = "AuthenticationError";
  }
}

/** 403 — Valid key but insufficient permissions for this tier. */
export class ForbiddenError extends ClawpumpError {
  constructor(message: string, opts?: { requestId?: string; body?: unknown }) {
    super(message, { status: 403, ...opts });
    this.name = "ForbiddenError";
  }
}

/** 404 — Resource not found (e.g., unknown mint address, no liquidity). */
export class NotFoundError extends ClawpumpError {
  constructor(message: string, opts?: { requestId?: string; body?: unknown }) {
    super(message, { status: 404, ...opts });
    this.name = "NotFoundError";
  }
}

/** 422 — Validation error (bad parameters). */
export class ValidationError extends ClawpumpError {
  readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    opts?: {
      requestId?: string;
      body?: unknown;
      fieldErrors?: Record<string, string>;
    },
  ) {
    super(message, { status: 422, ...opts });
    this.name = "ValidationError";
    this.fieldErrors = opts?.fieldErrors;
  }
}

/** 429 — Rate limit exceeded. */
export class RateLimitError extends ClawpumpError {
  /** Epoch milliseconds when the caller can retry. */
  readonly retryAfter?: number;

  constructor(
    message: string,
    opts?: { requestId?: string; body?: unknown; retryAfter?: number },
  ) {
    super(message, { status: 429, ...opts });
    this.name = "RateLimitError";
    this.retryAfter = opts?.retryAfter;
  }
}

/** Swap-specific: insufficient liquidity for the requested trade. */
export class InsufficientLiquidityError extends ClawpumpError {
  constructor(message: string, opts?: { requestId?: string; body?: unknown }) {
    super(message, { status: 422, ...opts });
    this.name = "InsufficientLiquidityError";
  }
}

/** 5xx — Server error. Retryable. */
export class ServerError extends ClawpumpError {
  constructor(
    message: string,
    opts?: { status?: number; requestId?: string; body?: unknown },
  ) {
    super(message, { status: opts?.status ?? 500, ...opts });
    this.name = "ServerError";
  }
}

/** Network error — no response received (timeout, DNS failure, etc.). */
export class NetworkError extends ClawpumpError {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/** Request timed out. */
export class TimeoutError extends ClawpumpError {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}
