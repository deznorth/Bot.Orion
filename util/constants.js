const { devPrefix, prodPrefix } = require('../botconfig.json');

const isDev = process.env.NODE_ENV === 'dev';

let constants = {
  isDev,
  prefix: isDev ? devPrefix : prodPrefix,
};

module.exports = constants;