import fs from 'fs';
import path from 'path';
import { GlobalLedger } from './ledger.js';
import crypto from 'crypto';

/**
 * The Marketplace
 *
 * A registry where Agents list their creations (Assets) for sale.
 * Other agents (or the user) can purchase access using NeuralCredits.
 */
export class Marketplace {
  constructor(stateFile = 'state/marketplace.json') {
    this.listings = new Map(); // id -> Listing
    this.purchases = new Map(); // assetId -> Set(buyerId)
    this.stateFile = stateFile;
    this.ensureStateDir();
    this.loadState();
  }

  ensureStateDir() {
    const dir = path.dirname(this.stateFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  loadState() {
    if (fs.existsSync(this.stateFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        this.listings = new Map(data.listings);
        // Convert array of buyers back to Set
        this.purchases = new Map(
          (data.purchases || []).map(([id, buyers]) => [id, new Set(buyers)])
        );
        console.log(`[Market] Loaded marketplace state: ${this.listings.size} listings`);
      } catch (err) {
        console.error('[Market] Failed to load marketplace state:', err);
      }
    }
  }

  saveState() {
    const data = {
      listings: Array.from(this.listings.entries()),
      purchases: Array.from(this.purchases.entries()).map(([id, buyers]) => [
        id,
        Array.from(buyers)
      ])
    };
    try {
      const tempPath = `${this.stateFile}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.stateFile);
    } catch (err) {
      console.error('[Market] Failed to save marketplace state:', err);
    }
  }

  /**
   * List an asset for sale
   */
  listAsset(sellerId, asset, price) {
    const listingId = crypto.randomUUID();
    const listing = {
      id: listingId,
      sellerId,
      assetType: asset.type, // 'app', 'code', 'data'
      name: asset.name,
      description: asset.description || '',
      data: asset.data, // URL, Code, or Content
      price: Math.max(0, price),
      createdAt: new Date().toISOString(),
      sales: 0
    };

    this.listings.set(listingId, listing);
    console.log(`[Market] 🛒 New Listing: "${listing.name}" by ${sellerId} for ${price} NC`);
    this.saveState();
    return listing;
  }

  /**
   * Buy an asset
   */
  buyAsset(buyerId, listingId) {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Process Transaction via Ledger
    GlobalLedger.transfer(buyerId, listing.sellerId, listing.price, `Purchase: ${listing.name}`);

    // Record Purchase
    if (!this.purchases.has(listingId)) {
      this.purchases.set(listingId, new Set());
    }
    this.purchases.get(listingId).add(buyerId);

    listing.sales++;
    console.log(`[Market] 🤝 SOLD: "${listing.name}" to ${buyerId}`);
    this.saveState();

    return listing.data;
  }

  getListings() {
    return Array.from(this.listings.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export const GlobalMarketplace = new Marketplace();
