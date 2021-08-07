const { defaultCooldown } = require('../../botconfig.json');
const { prefix } = require('../util/constants');
const log = require('../util/logger').extend('help');

const exec = (message, args) => {
  const data = [];
  const { commands } = message.client;

  if (!args.length) {
    data.push('🤖 Here\'s a list of all my commands:\n');
    data.push(commands.map(command => `**${command.name}** -- ${command.description}`).join('\n'));
    data.push(`\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`);

    return message.author.send(data, { split: true })
      .then(() => {
        if (message.channel.type === 'dm') return;
        message.reply('🤖 I\'ve sent you a DM with all my commands!');
      })
      .catch(error => {
        log(`Could not send help DM to ${message.author.tag}.\n`, error);
        message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
      });
  }

  const name = args[0].toLowerCase();
  const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

  if (!command) {
    return message.reply(`The command "${name}" does not exist. type "${prefix}help" to see a list of available commands.`);
  }

  data.push(`**Name:** ${command.name}`);

  if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
  if (command.description) data.push(`**Description:** ${command.description}`);
  if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
  if (command.example) data.push(`**Example:** ${prefix}${command.name} ${command.example}`);

  data.push(`**Cooldown:** ${command.cooldown || defaultCooldown} second(s)`);

  message.channel.send(data, { split: true });
};

module.exports = {
  name: 'help',
  aliases: ['h','commands'],
  description: 'Lists all of my available commands.',
  usage: '[command name]',
  example: 'ask',
  cooldown: 5,
  exec,
};