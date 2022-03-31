import RecordsClientManager from './RecordsClientManager';

import CipherSwpGostClient from './cipherSwpGost/CipherSwpGostClient';

const manager = new RecordsClientManager();

manager.register(new CipherSwpGostClient());

export default manager;
