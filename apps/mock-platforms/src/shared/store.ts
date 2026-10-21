import { ListingValues } from './types';

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
    ids(): string[] {
      return Object.keys(data);
    },
    reset(): void {
      for (const k of Object.keys(data)) delete data[k];
      Object.assign(data, JSON.parse(JSON.stringify(seedData)));
    },
  };
}

export type PlatformStore = ReturnType<typeof createStore>;

/**
 * In-memory store for listing data on a single mock platform.
 * Supports both class-based and function-based access.
 */
export class Store {
  private data: Map<string, ListingValues>;
  private readonly seed: Record<string, ListingValues>;

  constructor(seedData: Record<string, ListingValues>) {
    this.seed = seedData;
    this.data = new Map(Object.entries(seedData));
  }

  get(id: string): ListingValues | undefined {
    return this.data.get(id);
  }

  patch(id: string, fields: Partial<ListingValues>): ListingValues | null {
    const existing = this.data.get(id);
    if (!existing) {
      return null;
    }
    const updated: ListingValues = { ...existing, ...fields };
    this.data.set(id, updated);
    return updated;
  }

  reset(): void {
    this.data = new Map(Object.entries(this.seed));
  }

  ids(): string[] {
    return Array.from(this.data.keys());
  }
}
