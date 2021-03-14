const log = require('../util/logger').extend('ask');
const Discord = require('discord.js');
const { colors, reactions } =require('../../botconfig.json');
const { isDev } = require('../util/constants');

const askJob = require('../jobDefinitions/ask');

const buildQuestionEmbed = (author, options) => {

  const {
    question,
    duration,
    includeMaybe,
    passMinimum,
  } = options;

  const allowedReactions = includeMaybe ?
  `${reactions.yes}, ${reactions.no} and ${reactions.maybe}` :
  `${reactions.yes} and ${reactions.no}`;

  const baseEmbed = new Discord.MessageEmbed()
  .setColor(colors.blue)
  .setTitle(`${question}`)
  .addField('Asked by', author, true)
  .setFooter(`Only "${allowedReactions}" will be counted. Totals will not include my votes.`);

  const questionEmbed = new Discord.MessageEmbed(baseEmbed)
  .addField('close date/time', duration, true);

  if (passMinimum) {
    questionEmbed.addField('Required Votes', passMinimum, true);
  };

  return {
    baseEmbed,
    questionEmbed,
  };
};

const getOptions = (args) => {
  const options = {
    question: args[0],
    duration: args[1],
  };

  options.includeMaybe = ['true','yes','1'].includes(args[2]); // Using `new Boolean(args[2])` or `Boolean(args[2])` wasn't working.
  options.passMinimum = parseInt(args[3]) > 0 ? parseInt(args[3]) : null;

  log('with options:', options);

  return options;
};

const exec = async (message, args, agenda) => {
  const options = getOptions(args);

  const author = message.author;

  const {
    baseEmbed,
    questionEmbed,
  } = buildQuestionEmbed(author, options);

  const hereTag = isDev ? '' : '@here';

  const questionMessage = await message.channel.send(hereTag, questionEmbed);

  questionMessage.pin();

  setTimeout(() => {
    questionMessage.unpin();
  }, options.duration);

  if (message.channel.type !== 'dm') message.delete();

  questionMessage.react(reactions.yes);
  questionMessage.react(reactions.no);

  if (options.includeMaybe) questionMessage.react(reactions.maybe);

  const messageDetails = {
    messageId: questionMessage.id,
    channelId: questionMessage.channel.id,
  };

  agenda.schedule(options.duration, askJob.jobName, { hereTag, messageDetails, options, baseEmbed });
};

module.exports = {
  name: 'ask',
  description: 'Posts a question, collects answers and shows results after a given time limit.',
  usage: '"<question>" <duration> <allow "maybe" option> <minimum votes to pass>',
  example: '"is Baby Yoda better than Grogu?" "10 minutes" yes 3',
  argsRequired: true,
  guildOnly: !isDev, // Enable DM testing while in development
  exec,
};