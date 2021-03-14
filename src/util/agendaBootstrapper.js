const log = require('./logger').extend('agenda');

// Definition Imports
const ask = require('../jobDefinitions/ask');

// Handler Mapping
const handlerMap = new Map();
handlerMap.set(ask.jobName, ask.handlerCreator);

const bootstrap = (client, agenda) => {
  // Enable logging
  agenda.on('start', job => log(`Job "${job.attrs.name}" starting...`));
  agenda.on('success', job => log(`Job "${job.attrs.name}" completed successfully!`));
  agenda.on('fail', (err, job) => log(`Job "${job.attrs.name}" failed with error:\n${err.message}`));

  // Define all job handlers
  for (let [jobName, handlerCreator] of handlerMap) {
    if (typeof handlerCreator !== 'function') {
      // If not a function, assume an object w/ options
      agenda.define(jobName, handlerCreator.options, handler.handlerCreator(client));
    } else {
      agenda.define(jobName, handlerCreator(client));
    }
  }
}

module.exports = bootstrap;