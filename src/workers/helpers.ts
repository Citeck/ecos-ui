import { workersUrls } from './workers';

// Getting a web-worker for initialization
export async function createWorkerFromScript(nameWorker: string) {
  return new Worker(workersUrls[nameWorker] || '', { type: 'module' });
}
