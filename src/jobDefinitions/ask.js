const Discord = require('discord.js');
const moment = require('moment-timezone');
const { colors, reactions } =require('../../botconfig.json');

const buildResultsEmbed = (baseEmbed, options, results) => {
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

  const embed = new Discord.MessageEmbed(baseEmbed)
  .setColor(resultColor)
  .addField('Poll closed on', moment().tz('America/New_York').format('MM/DD/YY h:mm a'), true);

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

const getReactionResults = async reaction => {
  const votes = reaction.count - 1;
  const users = await reaction.users.fetch();

  const voters = users.filter(u => !u.bot);

  return {
    votes,
    voters,
  };
};

const handlerCreator = client => async job => {
  const {
    hereTag,
    messageDetails,
    options,
    baseEmbed,
  } = job.attrs.data;

  const channel = await client.channels.fetch(messageDetails.channelId);
  const message = await channel.messages.fetch(messageDetails.messageId);

  const yesReactions = await message.reactions.resolve(reactions.yes);
  const noReactions = await message.reactions.resolve(reactions.no);
  const maybeReactions = options.includeMaybe ? await message.reactions.resolve(reactions.maybe) : null;

  const yesResults = await getReactionResults(yesReactions);
  const noResults = await getReactionResults(noReactions);
  const maybeResults = options.includeMaybe ? await getReactionResults(maybeReactions) : null;

  const resultsEmbed = buildResultsEmbed(baseEmbed, options, {
    yesResults,
    noResults,
    maybeResults,
  });

  message.channel.send(hereTag, resultsEmbed);
};

module.exports = {
  jobName: 'ask_resolve',
  handlerCreator,
}