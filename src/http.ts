import {
  ClawpumpError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  InsufficientLiquidityError,
  ServerError,
  NetworkError,
  TimeoutError,
} from "./errors.js";

const DEFAULT_BASE_URL = "https://agents.clawpump.tech/api/v1";
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRY_DELAY = 1_000;

export interface HttpClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  fetch: typeof globalThis.fetch;
}

export function createHttpConfig(opts: {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  fetch?: typeof globalThis.fetch;
}): HttpClientConfig {
  return {
    apiKey: opts.apiKey,
    baseUrl: (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    timeout: opts.timeout ?? DEFAULT_TIMEOUT,
    retries: opts.retries ?? 0,
    retryDelay: opts.retryDelay ?? DEFAULT_RETRY_DELAY,
    fetch: opts.fetch ?? globalThis.fetch,
  };
}

function isRetryable(error: ClawpumpError): boolean {
  return (
    error instanceof ServerError ||
    error instanceof NetworkError ||
    error instanceof TimeoutError ||
    error instanceof RateLimitError
  );
}

function parseErrorBody(body: unknown): {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
} {
  if (typeof body === "object" && body !== null) {
    const obj = body as Record<string, unknown>;
    return {
      message:
        typeof obj.error === "string"
          ? obj.error
          : typeof obj.message === "string"
            ? obj.message
            : "Unknown error",
      code: typeof obj.code === "string" ? obj.code : undefined,
      fieldErrors:
        typeof obj.field_errors === "object" && obj.field_errors !== null
          ? (obj.field_errors as Record<string, string>)
          : undefined,
    };
  }
  return { message: String(body) };
}

function mapStatusToError(
  status: number,
  body: unknown,
  requestId?: string,
): ClawpumpError {
  const parsed = parseErrorBody(body);
  const opts = { requestId, body };

  switch (status) {
    case 401:
      return new AuthenticationError(parsed.message, opts);
    case 403:
      return new ForbiddenError(parsed.message, opts);
    case 404:
      return new NotFoundError(parsed.message, opts);
    case 422:
      if (parsed.code === "INSUFFICIENT_LIQUIDITY") {
        return new InsufficientLiquidityError(parsed.message, opts);
      }
      return new ValidationError(parsed.message, {
        ...opts,
        fieldErrors: parsed.fieldErrors,
      });
    case 429: {
      return new RateLimitError(parsed.message, opts);
    }
    default:
      if (status >= 500) {
        return new ServerError(parsed.message, { status, ...opts });
      }
      return new ClawpumpError(parsed.message, { status, ...opts });
  }
}

export type HttpMethod = "GET" | "POST" | "DELETE";

export interface RequestOptions {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export async function request<T>(
  config: HttpClientConfig,
  opts: RequestOptions,
): Promise<T> {
  const url = buildUrl(config.baseUrl, opts.path, opts.query);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    Accept: "application/json",
  };

  let reqBody: string | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    reqBody = JSON.stringify(opts.body);
  }

  let lastError: ClawpumpError | undefined;
  const maxAttempts = 1 + config.retries;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0 && lastError) {
      const delay =
        lastError instanceof RateLimitError && lastError.retryAfter
          ? lastError.retryAfter - Date.now()
          : config.retryDelay * Math.pow(2, attempt - 1);
      if (delay > 0) {
        await sleep(delay);
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      let response: Response;
      try {
        response = await config.fetch(url, {
          method: opts.method,
          headers,
          body: reqBody,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const requestId = response.headers.get("x-request-id") ?? undefined;

      if (response.ok) {
        return (await response.json()) as T;
      }

      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { error: response.statusText };
      }

      // Parse Retry-After for 429
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfterMs = retryAfterHeader
          ? Date.now() + Number(retryAfterHeader) * 1000
          : undefined;
        lastError = new RateLimitError(
          parseErrorBody(errorBody).message,
          { requestId, body: errorBody, retryAfter: retryAfterMs },
        );
      } else {
        lastError = mapStatusToError(response.status, errorBody, requestId);
      }

      if (!isRetryable(lastError)) {
        throw lastError;
      }
    } catch (error) {
      if (error instanceof ClawpumpError) {
        lastError = error;
        if (!isRetryable(error)) throw error;
        continue;
      }

      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        lastError = new TimeoutError(
          `Request timed out after ${config.timeout}ms`,
        );
        continue;
      }

      lastError = new NetworkError(
        error instanceof Error ? error.message : "Network request failed",
      );
    }
  }

  throw lastError ?? new NetworkError("Request failed");
}

function buildUrl(
  base: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(`${base}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
