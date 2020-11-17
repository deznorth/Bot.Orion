# Bot.Orion

This is a bot created for a personal Discord Server

## Creating new commands

1. Create a new file under `/commands`. The name should ideally match the name of the command.
2. The file must have the following content (customize the values to fit your command)

```javascript
/**
 * The {message} param is the message object from the "discordjs" npm package
 * The {args} param is an array of strings containing the text that triggered the command,
 * space separated (ignores spaces within double quotes) and excluding the command itself
 * example:
 *    this: '!ask "among us tonight?" 15 yes 8'
 *    becomes: ['"among us tonight?"', '15', 'yes', '8']
 */
const exec = (message, args) => {
  // Your code here...
};

module.exports = {
  // Required
  name: 'ask',
  // Optional - If you want to assign any alternative names to your command do it here
  aliases: ['h', 'commands'],
  // Recommended - Just a brief description
  description:
    'Posts a question, collects answers and shows results after a given time limit.',
  // Recommended - template string shown by help command
  usage:
    '"<question>" <duration in minutes> <allow "maybe" option> <minimum votes to pass>',
  // Recommended - Example showed by the help command
  example: '"does anyone want to play rocket league?" 10 true 3',
  // Optional - Prevents command from running when called with no arguments
  argsRequired: true,
  // Optional - Prevents user from using command in DMs (current value allows it during development)
  guildOnly: !(process.env.NODE_ENV === 'dev'),
  // Optional - Time a user needs to wait before using the command again (in seconds) [defaults to 3]
  cooldown: 5,
  // Required - this references the method declared above
  exec,
};
```
