import { ListingValues } from './types.js';

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
  }
}
