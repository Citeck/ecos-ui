import Logger from 'logplease';

const logLevel = process.env.NODE_ENV === 'development' ? Logger.LogLevels.DEBUG : Logger.LogLevels.ERROR;
Logger.setLogLevel(logLevel);

const logger = Logger.create('ECOS');

window.Citeck = window.Citeck || {};
window.Citeck.logger = logger;

export default logger;
