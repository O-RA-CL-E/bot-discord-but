const fs = require("fs");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { prefix, token } = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.once("ready", () => {
  console.log(`${client.user.tag} est en ligne ✅`);
});

// --- Gestion des commandes texte (préfixe) ---
client.on("messageCreate", (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    command.executeMessage(message, args);
  } catch (error) {
    console.error(error);
    message.reply("⚠️ Erreur en exécutant la commande.");
  }
});

// --- Gestion des commandes slash ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.executeSlash(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "⚠️ Erreur en exécutant la commande.", ephemeral: true });
  }
});

client.login(token);
