const isDev = require('./constants').isDev;
const logger = !isDev ? require('debug-timezone')('orion', 'MM/DD/YY h:mm:ss A z', 'America/New_York') : require('debug')('orion');

module.exports = logger;