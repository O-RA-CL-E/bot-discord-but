process.env.DISCORDJS_DISABLE_DAVE = "true";

const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config.json');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates
	]
});

client.commands = new Collection();

// Chargement des commandes
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// Quand le bot est prêt
client.once('ready', () => {
	console.log(`Bot connecté en tant que ${client.user.tag}`);
});

// Gestion des messages
client.on('messageCreate', async message => {
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName);
	if (!command) return;

	try {
		await command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply("Erreur lors de l'exécution de la commande !");
	}
});

// Lancer le bot
client.login(config.token);
