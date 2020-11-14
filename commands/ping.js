
const exec = (message, args) => {
  message.channel.send('pong!');
};

module.exports = {
  name: 'ping',
  description: ' Ping!',
  exec,
}