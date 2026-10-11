// Runtime-mutable mock backend configuration. Adjustable from Settings so the
// benchmark can exercise slow/failing network conditions deterministically.
export const mockConfig = {
  latencyMs: 250,
  failureRate: 0,
  pageSize: 20,
};

export type MockConfig = typeof mockConfig;
