
const moment = require('moment-timezone');
const debug = require('debug');

const logger = namespace => {
  debug.formatArgs = function (args) {
    const {namespace: name, useColors} = this;
    const timestamp = `[${moment().tz('America/New_York').format('MM-DD-YYYY h:mm:ss a z')}]`;

    if (useColors) {
      const c = this.color;
      const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
      const prefix = `  ${colorCode};1m${name} \u001B[0m`;

      args[0] = timestamp + prefix + args[0].split('\n').join('\n' + prefix);
      args.push(colorCode + 'm+' + debug.humanize(this.diff) + '\u001B[0m');
    } else {
      args[0] = timestamp + name + ' ' + args[0];
    }
  }

  return debug(namespace);
}

module.exports = logger('orion');