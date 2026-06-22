import RecordsClientManager from './RecordsClientManager';

/**
 * Empty client manager. Platform-specific clients (e.g. the web-only
 * CipherSwpGost CAPICOM client) are registered by the host app at startup
 * via `manager.register(new MyClient())`.
 */
const manager = new RecordsClientManager();

export default manager;
