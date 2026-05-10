import { PAGE_SIZE } from './constants';

export function staggerDelay(index: number, loadedCount: number): number {
  if (loadedCount <= PAGE_SIZE) {
    return index * 0.045;
  }
  const newBatchStart = loadedCount - PAGE_SIZE;
  if (index >= newBatchStart) {
    return (index - newBatchStart) * 0.085;
  }
  return 0;
}
