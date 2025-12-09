// queue.js : stockage de la file d’attente par serveur
const { createAudioPlayer } = require('@discordjs/voice');

const queue = new Map();
// clé = guildId, valeur = { voiceChannel, connection, player, songs }

module.exports = { queue };
