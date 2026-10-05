import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { vi } from "vitest";

export function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

type Reply = { status?: number; body?: unknown };
type Routes = Record<string, Reply | ((body: unknown) => Reply)>;

/**
 * Replace fetch with fake API routes, keyed like "GET /api/v1/parties/1/menu".
 * Returns the list of calls made, so tests can check what was sent.
 */
export function mockApi(routes: Routes) {
  const calls: { method: string; path: string; body: unknown }[] = [];

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options?: RequestInit) => {
      const method = options?.method ?? "GET";
      const path = new URL(url).pathname;
      const body =
        typeof options?.body === "string" ? JSON.parse(options.body) : null;
      calls.push({ method, path, body });

      const route = routes[`${method} ${path}`];
      if (!route) {
        return new Response(JSON.stringify({ detail: "Not Found" }), {
          status: 404,
        });
      }
      const reply = typeof route === "function" ? route(body) : route;
      return new Response(JSON.stringify(reply.body ?? null), {
        status: reply.status ?? 200,
      });
    }),
  );

  return calls;
}
