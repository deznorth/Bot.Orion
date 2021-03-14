const isDev = require('./constants').isDev;
const logger = !isDev ? require('debug-timezone') : require('debug');

module.exports = namespace => !isDev ? logger(namespace, 'MM/DD/YY h:mm:ss A z', 'America/New_York') : logger(namespace);