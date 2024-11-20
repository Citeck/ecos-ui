import { createWorkerFromScript } from '../helpers/util';

let workerInstance = null;
let sendMethod = null;

const initializeWorker = async () => {
  workerInstance = await createWorkerFromScript('/workers/docLib-script.js');

  sendMethod = message => {
    if (workerInstance) {
      workerInstance.postMessage(message);
    }
  };

  workerInstance.onmessage = event => {
    console.log('Message from Worker:', event.data);
  };

  return { worker: workerInstance, send: sendMethod };
};

export const getWorker = () => workerInstance;
export const sendToWorker = message => sendMethod && sendMethod(message);

export default initializeWorker;
