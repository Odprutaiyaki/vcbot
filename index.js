```js
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

const OpenAI = require("openai");

const fs = require("fs");
const path = require("path");

const OWNER_ID = "527442009405784088";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
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

    console.log(`再生中: ${song} 😺`);
  }

  player.on(AudioPlayerStatus.Idle, () => {
    playRandom();
  });

  playRandom();

  connection.subscribe(player);
}

client.once("ready", async () => {

  console.log(`${client.user.tag} 起動 😺`);

  const commands = [

    new SlashCommandBuilder()
      .setName("join")
      .setDescription("VC参加"),

    new SlashCommandBuilder()
      .setName("leave")
      .setDescription("VC退出")

  ].map(command => command.toJSON());

  const rest =
    new REST({ version: "10" })
      .setToken(process.env.TOKEN);

  try {

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("コマンド登録完了 😼");

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
        "先にVC入って 😾"
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

    interaction.reply("VC参加した 😺");
  }

  if (interaction.commandName === "leave") {

    if (interaction.user.id !== OWNER_ID) {

      return interaction.reply({
        content: "れくん専用 😾",
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
        "VC退出した 😺"
      );

    } else {

      interaction.reply(
        "VC入ってない 😿"
      );

    }
  }
});

client.on("messageCreate", async message => {

  if (message.author.bot) return;

  if (!message.channel.isDMBased()) return;

  if (message.author.id !== OWNER_ID) {

    return message.reply(
      "れくん専用Bot 😾"
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
        "先にVC入って 😾"
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
      "VC参加した 😺"
    );
  }

  const response =
    await openai.chat.completions.create({

      model: "gpt-4.1-mini",

      messages: [

        {
          role: "system",
          content:
            "猫っぽく優しく話すDiscord AI"
        },

        {
          role: "user",
          content: text
        }

      ]
    });

  message.reply(
    response.choices[0].message.content
  );
});

client.login(process.env.TOKEN);
```
