const log = require('debug')('orion:ask');
const Discord = require('discord.js');
const { colors, reactions } =require('../botconfig.json');
const moment = require('moment-timezone');
const { isDev } = require('../util/constants');

const DEFAULT_DURATION = 5 * 60 * 1000;

const buildQuestionEmbed = (author, options) => {

  const {
    question,
    expiration,
    includeMaybe,
    passMinimum,
  } = options;

  const allowedReactions = includeMaybe ?
  `${reactions.yes}, ${reactions.no} and ${reactions.maybe}` :
  `${reactions.yes} and ${reactions.no}`;

  const baseEmbed = new Discord.MessageEmbed()
  .setColor(colors.blue)
  .setTitle(`"${question}"`)
  .addField('Asked by', author, true)
  .setFooter(`Only "${allowedReactions}" will be counted. Totals will not include my votes.`);

  const questionEmbed = new Discord.MessageEmbed(baseEmbed)
  .addField('Poll closes by', expiration, true);

  if (passMinimum) {
    questionEmbed.addField('Required Votes', passMinimum, true);
  };

  return {
    baseEmbed,
    questionEmbed,
  };
};

const buildResultsEmbed = (baseEmbed, options, results) => {

  const {
    includeMaybe,
    expiration,
    passMinimum,
  } = options;

  const {
    yesResults,
    noResults,
    maybeResults,
  } = results;

  let resultColor = colors.orange; // default value for ties or maybes

  const resultColors = [
    { ...yesResults, color: colors.green },
    { ... noResults, color: colors.red },
  ];

  if (includeMaybe) resultColors.push({ ...maybeResults, color: colors.grey });

  resultColors.sort((a, b) => {
    if (a.votes === b.votes) return 0;
    return a.votes > b.votes ? -1 : 1;
  })

  const votesArr = Object.values(results).filter(v => v !== null).map(r => r.votes);

  const noResponses = votesArr.every(v => v === 0);

  const isTie = noResponses || votesArr.every((v, i, arr) => v === arr[0]);

  if (!isTie) resultColor = resultColors[0].color;

  if (passMinimum && passMinimum > yesResults.votes) resultColor = colors.red;

  const embed = new Discord.MessageEmbed(baseEmbed)
  .setColor(resultColor)
  .addField('Poll closed on', expiration, true);
  

  if(passMinimum) {
    embed.addField('Required Votes', passMinimum, true);
  } else {
    embed.addField('\u200b','\u200b',true);
  }

  embed.addField(reactions.yes, appendVotersToResult(yesResults), true)
  .addField(reactions.no, appendVotersToResult(noResults), true);

  if (includeMaybe) embed.addField(reactions.maybe, appendVotersToResult(maybeResults), true);

  return embed;
};

const appendVotersToResult = ({ votes, voters }) => {
  const votersString = voters.map(voter => `${voter}\n`);
  return `${votes}\n${votersString}`;
};

const getOptions = (args) => {
  const options = {
    question: args[0],
    duration: args[1] ? parseFloat(args[1]) * 60 * 1000 : DEFAULT_DURATION, // convert min to ms
  };

  options.expiration = moment(Date.now() + options.duration).tz('America/New_York').format('MM/DD/YY  h:mm a');
  options.includeMaybe = ['true','yes','1'].includes(args[2]); // Using `new Boolean(args[2])` or `Boolean(args[2])` wasn't working.
  options.passMinimum = parseInt(args[3]) > 0 ? parseInt(args[3]) : null;

  log('with options:', options);

  return options;
};

const reactionFilter = reaction => [reactions.yes, reactions.no, reactions.maybe].includes(reaction.emoji.name);

const getReactionResults = async (reactionCollection, filterReaction) => {
  const reaction = reactionCollection.filter(reaction => reaction.emoji.name === filterReaction).first();
  const votes = reaction.count - 1;
  const users = await reaction.users.fetch();

  const voters = users.filter(u => !u.bot);

  return {
    votes,
    voters,
  };
};

const exec = async (message, args) => {

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
  
  await questionMessage.awaitReactions(reactionFilter, { time: options.duration })
  .then(async collected => {
    const yesResults = await getReactionResults(collected, reactions.yes);
    const noResults = await getReactionResults(collected, reactions.no);
    const maybeResults = options.includeMaybe ? await getReactionResults(collected, reactions.maybe) : null;

    const resultsEmbed = buildResultsEmbed(baseEmbed, options, {
      yesResults,
      noResults,
      maybeResults,
    });

    questionMessage.channel.send(hereTag, resultsEmbed);
  });
};

module.exports = {
  name: 'ask',
  description: 'Posts a question, collects answers and shows results after a given time limit.',
  usage: '"<question>" <duration in minutes> <allow "maybe" option> <minimum votes to pass>',
  example: '"does anyone want to play rocket league?" 10 true 3',
  argsRequired: true,
  guildOnly: !isDev, // Enable DM testing while in development
  exec,
};