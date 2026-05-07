export type InstallPrivyResetInstrumentationOptions = {
  onReset: () => void;
};

export function installPrivyResetInstrumentation(
  opts: InstallPrivyResetInstrumentationOptions,
): () => void {
  if (typeof window === "undefined") return () => {};

  const resetPrivyStateOnce = () => {
    const w = window as unknown as { __endurPrivyResetDone?: boolean };
    if (w.__endurPrivyResetDone) return;
    w.__endurPrivyResetDone = true;

    const keysToClear = [
      // session/auth
      "privy:token",
      "privy:pat",
      "privy:refresh_token",
      // oauth handshake
      "privy:state_code",
      "privy:code_verifier",
      // connections cache
      "privy:connections",
    ];
    for (const k of keysToClear) {
      try {
        if (window.localStorage.getItem(k) !== null) {
          window.localStorage.removeItem(k);
        }
      } catch {
        // ignore
      }
    }

    opts.onReset();
  };

  const w = window as unknown as {
    fetch?: typeof window.fetch;
    __endurFetchInstrumented?: boolean;
  };

  if (!w.__endurFetchInstrumented && typeof w.fetch === "function") {
    const originalFetch = w.fetch.bind(window);
    w.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;

      const isPrivyBackedEndpoint =
        url === "/api/wallet" ||
        url === "/api/wallet/create" ||
        url === "/api/wallet/sign" ||
        url === "/api/paymaster";

      let res: Response;
      try {
        res = await originalFetch(input as any, init as any);
      } catch (err) {
        if (isPrivyBackedEndpoint) {
          resetPrivyStateOnce();
        }
        throw err;
      }

      try {
        if (isPrivyBackedEndpoint && !res.ok) {
          resetPrivyStateOnce();
        } else if (
          (url === "/api/wallet" || url === "/api/wallet/create") &&
          res.ok
        ) {
          res
            .clone()
            .json()
            .then((body) => {
              const b = body as any;
              const shouldReset =
                b &&
                typeof b === "object" &&
                "wallet" in b &&
                b.wallet === null;
              if (!shouldReset) return;
              resetPrivyStateOnce();
            })
            .catch(() => {});
        } else if (url === "/api/paymaster" && res.ok) {
          // JSON-RPC errors are returned with HTTP 200; detect error envelope.
          res
            .clone()
            .json()
            .then((body) => {
              const b = body as any;
              if (!b || typeof b !== "object") return;
              if ("error" in b) {
                resetPrivyStateOnce();
              }
            })
            .catch(() => {});
        } else if (url === "/api/wallet/sign" && res.ok) {
          // If the route responds with an error envelope but 200, reset anyway.
          res
            .clone()
            .json()
            .then((body) => {
              const b = body as any;
              if (!b || typeof b !== "object") return;
              if ("error" in b) {
                resetPrivyStateOnce();
              }
            })
            .catch(() => {});
        }
      } catch {
        // ignore
      }

      return res;
    }) as any;
    w.__endurFetchInstrumented = true;
  }
  return () => {};
}
