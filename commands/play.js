const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
const { queue } = require('../queue');
const fs = require('fs');

// --- CONFIGURATION COOKIES CORRIGÉE ---
if (fs.existsSync('./cookies.json')) {
	try {
		const rawData = fs.readFileSync('./cookies.json');
		const cookiesArray = JSON.parse(rawData);

		// CORRECTION ICI : On transforme le tableau JSON en une chaîne de texte "nom=valeur;"
		// play-dl ne sait pas lire le JSON brut, il veut une string.
		if (Array.isArray(cookiesArray)) {
			const cookieString = cookiesArray.map(c => `${c.name}=${c.value}`).join('; ');
			
			play.setToken({
				youtube: {
					cookie: cookieString 
				}
			});
			console.log("[INFO] Cookies chargés et convertis avec succès.");
		} else {
			console.warn("[ATTENTION] Le fichier cookies.json n'est pas un tableau valide.");
		}
	} catch (err) {
		console.error("[ERREUR] Le fichier cookies.json est mal formé ou illisible.", err);
	}
} else {
	console.warn("[ATTENTION] Fichier cookies.json introuvable.");
}

module.exports = {
	name: 'play',
	description: 'Jouer une musique via un lien YouTube',
	async execute(message, args) {

		// 1. Vérifications Discord de base
		if (!args[0]) return message.reply("Donne-moi un lien YouTube !");
		
		const voiceChannel = message.member.voice.channel;
		if (!voiceChannel) return message.reply("Tu dois être dans un vocal pour écouter de la musique !");

		const permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has("Connect") || !permissions.has("Speak")) {
			return message.reply("Je n'ai pas la permission de rejoindre/parler !");
		}

		let serverQueue = queue.get(message.guild.id);
		let song;

		// 2. Récupération des infos YouTube
		try {
			// Validation sommaire pour éviter de crash sur du texte aléatoire
			let validate = play.yt_validate(args[0]);
			if (validate !== 'video') {
				return message.reply("Ce lien n'est pas une vidéo YouTube valide.");
			}

			const info = await play.video_info(args[0]);
			
			if (!info || !info.video_details) {
				throw new Error("Impossible de récupérer les détails");
			}

			song = {
				title: info.video_details.title,
				// On force une URL standard propre :
				url: `https://www.youtube.com/watch?v=${info.video_details.id}`, 
				duration: info.video_details.durationRaw
			};

		} catch (error) {
			console.error("[ERREUR INFO]", error);
			return message.reply("Impossible de trouver cette vidéo. Vérifiez le lien ou les cookies.");
		}

		// 3. Gestion de la File d'attente
		if (!serverQueue) {
			const queueContruct = {
				voiceChannel: voiceChannel,
				connection: null,
				player: createAudioPlayer(),
				songs: [],
				volume: 1
			};

			queue.set(message.guild.id, queueContruct);
			queueContruct.songs.push(song);

			try {
				const connection = joinVoiceChannel({
					channelId: voiceChannel.id,
					guildId: message.guild.id,
					adapterCreator: message.guild.voiceAdapterCreator
				});
				queueContruct.connection = connection;

				// On lance la lecture
				playSong(message.guild, queueContruct.songs[0]);
			} catch (err) {
				console.error(err);
				queue.delete(message.guild.id);
				return message.reply("Je n'arrive pas à rejoindre le salon vocal.");
			}
		} else {
			serverQueue.songs.push(song);
			return message.reply(`**${song.title}** a été ajouté à la file !`);
		}
	}
};

async function playSong(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		// Optionnel : Quitter le vocal après un délai si la liste est vide
		/* setTimeout(() => {
			if (serverQueue && serverQueue.songs.length === 0) {
				serverQueue.connection.destroy();
				queue.delete(guild.id);
			}
		}, 60000); 
		*/
		return;
	}

	try {
		console.log(`[DEBUG] Tentative de lecture : ${song.title}`);

		// --- C'est ici que play-dl utilise les cookies ---
		let stream = await play.stream(song.url);

		const resource = createAudioResource(stream.stream, {
			inputType: stream.type
		});

		serverQueue.player.play(resource);
		serverQueue.connection.subscribe(serverQueue.player);

		serverQueue.player.on(AudioPlayerStatus.Idle, () => {
			serverQueue.songs.shift();
			playSong(guild, serverQueue.songs[0]);
		});

		serverQueue.player.on('error', error => {
			console.error(`[ERREUR PLAYER] : ${error.message}`);
			serverQueue.songs.shift();
			playSong(guild, serverQueue.songs[0]);
		});

	} catch (error) {
		// C'est ici qu'on capture "Invalid URL" si ça arrive encore
		console.error(`[ERREUR CRITIQUE STREAM] : ${error.message}`);
		
		message_erreur = "Erreur lors de la lecture.";
		if (error.message.includes("403")) message_erreur += " (Accès refusé par YouTube)";
		if (error.message.includes("Sign in")) message_erreur += " (Contenu soumis à limite d'âge)";

		console.log("Passage à la chanson suivante...");
		serverQueue.songs.shift();
		playSong(guild, serverQueue.songs[0]);
	}
}