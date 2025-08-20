export interface BatchProcessorOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  onProgress?: (current: number, total: number) => void;
  onBatchComplete?: (batch: unknown[], batchIndex: number) => void;
  onComplete?: (results: unknown[]) => void;
  onError?: (error: unknown, batch: unknown[], batchIndex: number) => void;
}

export class BatchProcessor {
  private batchSize: number;
  private delayBetweenBatches: number;
  private onProgress?: (current: number, total: number) => void;
  private onBatchComplete?: (batch: unknown[], batchIndex: number) => void;
  private onComplete?: (results: unknown[]) => void;
  private onError?: (error: unknown, batch: unknown[], batchIndex: number) => void;

  constructor(options: BatchProcessorOptions = {}) {
    this.batchSize = options.batchSize || 10;
    this.delayBetweenBatches = options.delayBetweenBatches || 1000;
    this.onProgress = options.onProgress;
    this.onBatchComplete = options.onBatchComplete;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
  }

  async process<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    const totalBatches = Math.ceil(items.length / this.batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const startIndex = i * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, items.length);
      const batch = items.slice(startIndex, endIndex);

      try {
        // Process the batch
        const batchResults = await processor(batch);
        results.push(...batchResults);

        // Call progress callback
        if (this.onProgress) {
          this.onProgress(endIndex, items.length);
        }

        // Call batch complete callback
        if (this.onBatchComplete) {
          this.onBatchComplete(batch as unknown[], i);
        }

        // Add delay between batches (except for the last batch)
        if (i < totalBatches - 1 && this.delayBetweenBatches > 0) {
          await this.delay(this.delayBetweenBatches);
        }
      } catch (error) {
        // Call error callback
        if (this.onError) {
          this.onError(error, batch as unknown[], i);
        }
        throw error;
      }
    }

    // Call complete callback
    if (this.onComplete) {
      this.onComplete(results as unknown[]);
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Utility function to create batches
export function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

// Utility function to process wallets in batches
export async function processWalletsInBatches<T, R>(
  wallets: T[],
  processor: (batch: T[]) => Promise<R[]>,
  options: BatchProcessorOptions = {}
): Promise<R[]> {
  const batchProcessor = new BatchProcessor(options);
  return batchProcessor.process(wallets, processor);
}
