require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
  Client,
  GatewayIntentBits
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior
} = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play
  }
});

function playRandomSong() {

  const songsPath = path.join(__dirname, "songs");

  const songs = fs.readdirSync(songsPath)
    .filter(file => file.endsWith(".mp3"));

  if (songs.length === 0) {
    console.log("mp3がない 😿");
    return;
  }

  const randomSong =
    songs[Math.floor(Math.random() * songs.length)];

  const resource = createAudioResource(
    path.join(songsPath, randomSong)
  );

  console.log(`再生中: ${randomSong}`);

  player.play(resource);
}

player.on(AudioPlayerStatus.Idle, () => {
  playRandomSong();
});

client.once("ready", async () => {

  console.log(`${client.user.tag} 起動 😺`);

  const guild = client.guilds.cache.get("1230110735410135140");

  if (!guild) {
    return console.log("サーバーが見つからない 😿");
  }

  const channel = guild.channels.cache.find(
    ch =>
      ch.name === "room" &&
      ch.type === 2
  );

  if (!channel) {
    return console.log("VCが見つからない 😿");
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false
  });

  connection.subscribe(player);

  console.log("VC接続完了 😼");

  playRandomSong();
});

client.login(process.env.TOKEN);