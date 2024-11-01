import { createWorkerFromScript } from '../helpers/util';

const initializeWorker = async () => {
  const worker = await createWorkerFromScript('/workers/docLib-script.js');

  const send = message => {
    worker.postMessage(message);
  };

  // The basic `onmessage` method can be overridden
  worker.onmessage = event => {
    console.log('Result from Worker:', event.data);
  };

  return { worker, send };
};

export default initializeWorker;
