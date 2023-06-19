// Connect to a server at localhost:30003 that is sending messages in SBS1
// format.  You can pass an options object containing host and port to
// createClient to connect to a different server/port.
const sbs1 = require("sbs1");
const express = require("express");
const cron = require("node-cron");
const axios = require("axios");
const bodyParser = require("body-parser");

const PORT = 18888;
const client = sbs1.createClient();
const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let receivedLocalADSBMessages = {};
let receivedRemoteADSBMessages = {};
let remoteADSBServerURL =
  "https://opensky-network.org/api/states/all?lamin=31.42&lomin=123.23&lamax=43.56&lomax=131.75";
let isConnectionEstablished = false;
let isInitialfetchCompleted = false;

const fetchRemoteADSBMessage = () =>
  axios({
    method: "get",
    url: remoteADSBServerURL,
    timeout: 10000,
  })
    .then((res) => {
      receivedRemoteADSBMessages = res.data;
      isConnectionEstablished = true;
    })
    .catch((err) => {
      isConnectionEstablished = false;
    });

const doInitialFetch = async () => {
  if (!isInitialfetchCompleted) {
    const res = await fetchRemoteADSBMessage();

    if (res) {
      task.start();
      isInitialfetchCompleted = true;
    }
  }
};

//receive local ADSB messages
client.on("message", function (msg) {
  if (
    msg.message_type === sbs1.MessageType.TRANSMISSION &&
    msg.transmission_type === sbs1.TransmissionType.ES_AIRBORNE_POS
  ) {
    console.log("coords: " + msg.lat + ", " + msg.lon);
  }
});

//every 1 minute, receive remote ADSB messages
const task = cron.schedule(
  "*/* 1 * * * *",
  async () => {
    if (!isConnectionEstablished) {
      return;
    }

    const res = await fetchRemoteADSBMessage();
  },
  { scheduled: false }
);

//initial fetch on load
doInitialFetch();

app.get("/aircrafts", (req, res) => {
  if (isConnectionEstablished) {
    res.json(receivedRemoteADSBMessages);
  } else {
    res.json(receivedLocalADSBMessages);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
