/**
 * Shared in-memory store for a mock platform.
 * Accepts the seed data on startup; resets are applied by restarting the service.
 */
export function createStore(seedData: Record<string, Record<string, unknown>>) {
  const data: Record<string, Record<string, unknown>> = JSON.parse(JSON.stringify(seedData));

  return {
    get(id: string): Record<string, unknown> | undefined {
      return data[id];
    },
    patch(id: string, fields: Record<string, unknown>): Record<string, unknown> | undefined {
      if (!data[id]) return undefined;
      data[id] = { ...data[id], ...fields };
      return data[id];
    },
    list(): Record<string, unknown>[] {
      return Object.values(data);
    },
  };
}

export type PlatformStore = ReturnType<typeof createStore>;
