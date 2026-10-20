<<<<<<< HEAD
import { ListingValues } from './types';

/**
 * In-memory store for listing data on a single mock platform.
 *
 * State is reset on every process restart — intentional, so every demo
 * run starts from the same seeded state.
 *
 * Each platform creates its own Store instance with its seed data.
 */
export class Store {
  private data: Map<string, ListingValues>;
  private readonly seed: Record<string, ListingValues>;

  constructor(seedData: Record<string, ListingValues>) {
    this.seed = seedData;
    this.data = new Map(Object.entries(seedData));
  }

  /**
   * Returns the listing for the given ID, or undefined if not found.
   */
  get(id: string): ListingValues | undefined {
    return this.data.get(id);
  }

  /**
   * Applies a partial patch to the listing identified by id.
   * Only updates the fields present in the patch object.
   * Returns the updated listing, or null if the listing doesn't exist.
   */
  patch(id: string, fields: Partial<ListingValues>): ListingValues | null {
    const existing = this.data.get(id);
    if (!existing) {
      return null;
    }
    const updated: ListingValues = { ...existing, ...fields };
    this.data.set(id, updated);
    return updated;
  }

  /**
   * Resets all listings to their original seed state.
   * Called automatically on startup; also useful for testing.
   */
  reset(): void {
    this.data = new Map(Object.entries(this.seed));
  }

  /**
   * Returns all listing IDs tracked by this store.
   */
  ids(): string[] {
    return Array.from(this.data.keys());
=======
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

export class Store {
  private store: PlatformStore;

  constructor(seedData: Record<string, any>) {
    this.store = createStore(seedData);
  }

  get(id: string) {
    return this.store.get(id);
  }

  patch(id: string, fields: Record<string, unknown>) {
    return this.store.patch(id, fields);
  }

  ids() {
    return this.store.ids();
  }

  reset() {
    this.store.reset();
>>>>>>> d180802c4c2ddc23ddf2f8123f75e6f21fc6ee74
  }
}
