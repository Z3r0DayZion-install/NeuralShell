// In-flight request deduplication to prevent duplicate upstream calls
export class InFlightDeduplicator {
  constructor() {
    this.inFlightRequests = new Map(); // fingerprint -> { promise, timestamp, refCount }
  }

  registerRequest(fingerprint, promise) {
    const existing = this.inFlightRequests.get(fingerprint);
    if (existing) {
      existing.refCount += 1;
      return existing.promise;
    }

    const record = {
      promise,
      timestamp: Date.now(),
      refCount: 1
    };
    this.inFlightRequests.set(fingerprint, record);

    promise
      .then((result) => {
        record.result = result;
        record.resultTimestamp = Date.now();
      })
      .catch((err) => {
        record.error = err;
        record.errorTimestamp = Date.now();
      })
      .finally(() => {
        record.refCount -= 1;
        if (record.refCount <= 0) {
          this.inFlightRequests.delete(fingerprint);
        }
      });

    return promise;
  }

  getInFlightRequest(fingerprint) {
    const record = this.inFlightRequests.get(fingerprint);
    if (record) {
      record.refCount += 1;
      return record.promise;
    }
    return null;
  }

  size() {
    return this.inFlightRequests.size;
  }

  stats() {
    let totalRefCount = 0;
    let activeRequests = 0;

    for (const record of this.inFlightRequests.values()) {
      if (record.refCount > 0) {
        activeRequests += 1;
      }
      totalRefCount += record.refCount;
    }

    return {
      activeRequests,
      totalRefCount,
      uniqueFingerprints: this.inFlightRequests.size
    };
  }
}
