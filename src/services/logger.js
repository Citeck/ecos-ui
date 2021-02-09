import Logger from 'logplease';

Logger.setLogLevel(process.env.NODE_ENV === 'production' ? Logger.LogLevels.ERROR : Logger.LogLevels.DEBUG);

const logger = Logger.create('EcoS');

window.Citeck = window.Citeck || {};
window.Citeck.logger = logger;

export default logger;
