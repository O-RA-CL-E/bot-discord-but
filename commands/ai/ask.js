const { SlashCommandBuilder } = require('discord.js');
const { Ollama } = require('ollama');

const ollamaInstance = new Ollama({ host: 'http://127.0.0.1:11434' });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Pose une question à l\'IA')
        .addStringOption(option => 
            option.setName('question')
                .setDescription('Ta question')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await ollamaInstance.chat({
                model: process.env.OLLAMA_MODEL || 'llama3',
                messages: [
                    { role: 'system', content: 'Tu es un pote gamer sarcastique mais sympa sur un serveur Discord.' },
                    { role: 'user', content: interaction.options.getString('question') }
                ],
            });

            await interaction.editReply(response.message.content);
        } catch (e) {
            console.error("ERREUR OLLAMA :", e);
            await interaction.editReply("Erreur : Impossible de joindre l'IA. Vérifie qu'Ollama tourne sur le serveur.");
        }
    },
};