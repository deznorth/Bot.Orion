const log = require('debug')('orion:ask');
const Discord = require('discord.js');
const { colors, reactions } =require('../botconfig.json');

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

  const embed = new Discord.MessageEmbed()
  .setColor(colors.blue)
  .setTitle(question)
  .addField('Asked by', author, true)
  .addField('Expires by', expiration.toLocaleTimeString('en-US'), true)
  .setFooter(`Only "${allowedReactions}" will be counted. Totals will not include my votes.`);

  if (passMinimum) embed.addField('Required Votes', passMinimum, true);

  return embed;
};

const buildResultsEmbed = (questionEmbed, options, results) => {

  const {
    includeMaybe,
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

  const embed = new Discord.MessageEmbed(questionEmbed)
  .setColor(resultColor);

  if(!passMinimum) embed.addField('\u200b','\u200b',true);

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
    duration: parseFloat(args[1]) * 60 * 1000, // convert min to ms
  };

  options.expiration = new Date(Date.now() + options.duration);
  options.includeMaybe = ['true','yes','1'].includes(args[2]); // Using `new Boolean(args[2])` or `Boolean(args[2])` wasn't working.
  options.passMinimum = parseInt(args[3]) > 0 ? parseInt(args[3]) : null;

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
  
  const questionEmbed = buildQuestionEmbed(author, options);
  
  const questionMessage = await message.channel.send('@here', questionEmbed);

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

    const resultsEmbed = buildResultsEmbed(questionEmbed, options, {
      yesResults,
      noResults,
      maybeResults,
    });

    questionMessage.channel.send('@here', resultsEmbed);
  });
};

module.exports = {
  name: 'ask',
  description: 'Posts a question, collects answers and shows results after a given time limit.',
  usage: '"<question>" <duration in minutes> <allow "maybe" option> <minimum votes to pass>',
  example: '"does anyone want to play rocket league?" 10 true 3',
  argsRequired: true,
  guildOnly: !(process.env.NODE_ENV === 'dev'), // Enable DM testing while in development
  exec,
};