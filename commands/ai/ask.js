const { SlashCommandBuilder } = require('discord.js');
const ollama = require('ollama');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Pose une question à l\'IA')
        .addStringOption(option => option.setName('question').setDescription('Ta question').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const response = await ollama.chat({
                model: process.env.OLLAMA_MODEL || 'llama3',
                messages: [
                    { role: 'system', content: 'Tu es un pote gamer sarcastique mais sympa sur un serveur Discord.' },
                    { role: 'user', content: interaction.options.getString('question') }
                ],
            });
            await interaction.editReply(response.message.content);
        } catch (e) {
            await interaction.editReply("Erreur : Vérifie qu'Ollama tourne sur le serveur Linux.");
        }
    },
};