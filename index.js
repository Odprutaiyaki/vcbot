require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection
} = require("@discordjs/voice");

const fs = require("fs");
const path = require("path");

const OWNER_ID = "527442009405784088";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers
  ],

  partials: ["CHANNEL", "MESSAGE"]

});

const songsPath = path.join(__dirname, "songs");

function getRandomSong() {

  const files = fs.readdirSync(songsPath);

  const random =
    files[Math.floor(Math.random() * files.length)];

  return path.join(songsPath, random);

}

function playMusic(connection) {

  const player = createAudioPlayer();

  function playRandom() {

    const song = getRandomSong();

    const resource =
      createAudioResource(song);

    player.play(resource);

    console.log("Playing: " + song);

  }

  player.on(AudioPlayerStatus.Idle, () => {
    playRandom();
  });

  playRandom();

  connection.subscribe(player);

}

client.once("ready", async () => {

  console.log(client.user.tag + " started");

  const commands = [

    new SlashCommandBuilder()
      .setName("join")
      .setDescription("Join VC"),

    new SlashCommandBuilder()
      .setName("leave")
      .setDescription("Leave VC")

  ];

  const rest =
    new REST({ version: "10" })
      .setToken(process.env.TOKEN);

  try {

    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: commands.map(command =>
          command.toJSON()
        )
      }
    );

    console.log("Commands loaded");

  } catch (error) {

    console.error(error);

  }

});

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "join") {

    const channel =
      interaction.member.voice.channel;

    if (!channel) {

      return interaction.reply(
        "Join VC first"
      );

    }

    const connection =
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator:
          channel.guild.voiceAdapterCreator
      });

    playMusic(connection);

    interaction.reply("Joined VC");

  }

  if (interaction.commandName === "leave") {

    if (interaction.user.id !== OWNER_ID) {

      return interaction.reply({
        content: "Owner only",
        ephemeral: true
      });

    }

    const connection =
      getVoiceConnection(
        interaction.guild.id
      );

    if (connection) {

      connection.destroy();

      interaction.reply(
        "Left VC"
      );

    } else {

      interaction.reply(
        "Not in VC"
      );

    }

  }

});

client.on("messageCreate", async message => {

  if (message.author.bot) return;

  if (!message.channel.isDMBased()) return;

  if (message.author.id !== OWNER_ID) {

    return message.reply(
      "Owner only"
    );

  }

  const text = message.content;

  if (text.includes("通話入って")) {

    const guild =
      client.guilds.cache.first();

    const member =
      guild.members.cache.get(
        message.author.id
      );

    if (!member.voice.channel) {

      return message.reply(
        "Join VC first"
      );

    }

    const connection =
      joinVoiceChannel({
        channelId:
          member.voice.channel.id,
        guildId: member.guild.id,
        adapterCreator:
          member.guild.voiceAdapterCreator
      });

    playMusic(connection);

    return message.reply(
      "Joined VC"
    );

  }

  message.reply("AI OK");

});

client.login(process.env.TOKEN);