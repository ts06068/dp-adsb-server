// Connect to a server at localhost:30003 that is sending messages in SBS1
// format.  You can pass an options object containing host and port to
// createClient to connect to a different server/port.
var sbs1 = require('sbs1');
var client = sbs1.createClient();
client.on('message', function(msg) {
  if (msg.message_type === sbs1.MessageType.TRANSMISSION &&
      msg.transmission_type === sbs1.TransmissionType.ES_AIRBORNE_POS) {
    console.log('coords: ' + msg.lat + ', ' + msg.lon);
  }
});