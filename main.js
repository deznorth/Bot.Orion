require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const log = require('debug')('orion');
const config = require('./botconfig.json');

const client = new Discord.Client();

client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for(const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const prefix = config.prefix;

client.once('ready', () => {
  log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    activity: {
      name: `${config.prefix}help`,
      type: 'LISTENING',
    },
    status: 'online',
  });
});

client.on('message', message => {
  // Stop if message is created by the bot or if it doesn't start with prefix
  if(!message.content.startsWith(prefix) || message.author.bot) return;

  // Remove prefix and split space separated args from the message
  const argsString = message.content.slice(prefix.length);
  const argsArr = argsString.match(/(?:[^\s"]+|"[^"]*")+/g); // Get the arguments space separated. Ignore spaces between double quotes.
  const args = argsArr.map(s => s.replace(/^"|"$/g,''));
  const commandName = args.shift().toLowerCase();

  // Get the command by name or alias
  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  // Handle unknown command
  if (!command) {
    message.reply(`The command "${commandName}" does not exist. type "${prefix}help" to see a list of available commands.`);
    return;
  };

  // Check if command is not executable inside DMs
  if (command.guildOnly && message.channel.type === 'dm') {
    return message.reply('I can\'t execute that command inside DMs!');
  }

  // Validate there are enough arguments
  if (command.argsRequired && !args.length) {
    let reply = `You didn't provide enough arguments!`;

    if (command.usage) {
      reply += `\nTry using this format: \`${prefix}${commandName} ${command.usage}\``;
    }

    if (command.example) {
      reply += `\nExample: \`${prefix}${commandName} ${command.example}\``;
    }

    return message.channel.send(reply);
  }

  // Handle cooldowns
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const cooldownAmount = (command.cooldown || config.defaultCooldown) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${commandName}\` command.`);
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  }

  // Actually execute the command
  try {
    command.exec(message, args);
  } catch (error) {
    log(`error executing command: ${commandName}\n`, error);
    message.reply(`there was an error trying to execute the "${commandName}" command.`);
  }
});

// This must be at the end
client.login(process.env.API_TOKEN);