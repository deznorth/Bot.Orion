const log = require('debug')('orion:ask');
const { MessageEmbed } = require('discord.js');
const { colors } =require('../botconfig.json');

const buildEmbed = (author, question, expiration) => {
  return new MessageEmbed()
    .setColor(colors.blue)
    .setTitle(`"${question}"`)
    .addField('Asked by', author, true)
    .addField('Expires by', expiration.toLocaleTimeString('en-US'), true)
    .setFooter('Only thumbs up/down will be counted. Totals will not include my votes.');
};

const reactionFilter = reaction => {
  return ['👍', '👎'].includes(reaction.emoji.name);
};

const exec = async (message, args) => {
  const author = message.author;

  const duration = args.shift() * 60 * 1000; // convert min to ms
  const expiration = new Date(Date.now() + duration);
  const question = args.join(" ");
  
  const embed = buildEmbed(author, question, expiration);
  
  const poll = await message.channel.send(embed);

  if (message.channel.type !== 'dm') message.delete();

  poll.react('👍');
  poll.react('👎');
  
  await poll.awaitReactions(reactionFilter, { time: duration })
  .then(collected => {
    const upvotes = collected.filter(reaction => reaction.emoji.name === '👍').first().count - 1;
    const downvotes = collected.filter(reaction => reaction.emoji.name === '👎').first().count - 1;

    let resultColor = colors.orange;

    if (upvotes !== downvotes) {
      resultColor = upvotes > downvotes ? colors.green : colors.red;
    }

    const resultsEmbed = new MessageEmbed(embed)
    .setColor(resultColor)
    .addField('\u200b','\u200b',true)
    .addField('👍', upvotes, true)
    .addField('👎', downvotes, true);

    poll.edit(resultsEmbed);
  });
};

module.exports = {
  name: 'ask',
  description: 'Posts a question, collects answers and shows results after a given time limit.',
  usage: '<duration in minutes> <yes/no question>',
  example: '10 does anyone want to play rocket league?',
  argsRequired: true,
  // guildOnly: true, UNCOMMENT WHEN FINALIZING
  exec,
};