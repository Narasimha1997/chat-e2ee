const clients = require('./clients');
const channelValid = require('../api/chatLink/utils/validateChannel');

const connectionListener = (socket, io) => {
  socket.on('chat-join', async (data) => {
    const { userID, channelID, publicKey } = data;
    try {
      const { valid }  = await channelValid(channelID);
      if (!valid)
        return;
    }
    catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      return;
    }
    clients.setClientToChannel(userID, channelID, socket.id);
    socket.channelID = channelID;
    socket.userID = userID;
    // share the public key to the receiver if present
    const receiver = clients.getReceiverByChannel(channelID, userID);

    if (receiver) {
      const receiverSocket = io.sockets.sockets[receiver.sid];
      if (!receiverSocket) {
        return;
      }
      receiverSocket.emit('on-alice-join', { publicKey });
    }
  });

  socket.on('disconnect', () => {
    const { channelID, userID } = socket;
    try {
      const receiver = clients.getReceiverByChannel(channelID, userID);
      if (receiver) {
        const receiverSocket = io.sockets.sockets[receiver.sid];
        if (!receiverSocket) {
          // eslint-disable-next-line no-console
          console.log('socket not found!');
          return;
        }
        clients.deleteClient(userID, channelID);
        receiverSocket.emit('on-alice-disconnect');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  });

  socket.emit('message', 'ping!');
};

module.exports = {
  connectionListener
};