const { SlashCommandBuilder } = require('discord.js');
const { Ollama } = require('ollama');

const ollamaInstance = new Ollama({ host: 'http://127.0.0.1:11434' });

const sessions = new Map();

const MAX_HISTORY = 50; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Discute avec l\'IA (elle se souvient de la conversation)')
        .addStringOption(option => 
            option.setName('question')
                .setDescription('Ta question')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const userId = interaction.user.id;
        const userQuestion = interaction.options.getString('question');

        if (!sessions.has(userId)) {
            sessions.set(userId, [
                { 
                    role: 'system', 
                    content: 'Tu es un pote gamer sarcastique mais sympa sur un serveur Discord nommé "Le QG". Tu réponds de manière concise.' 
                }
            ]);
        }

        let userHistory = sessions.get(userId);

        userHistory.push({ role: 'user', content: userQuestion });

        try {
            const response = await ollamaInstance.chat({
                model: process.env.OLLAMA_MODEL || 'llama3',
                messages: userHistory,
            });

            const botReply = response.message.content;

            userHistory.push({ role: 'assistant', content: botReply });

            if (userHistory.length > MAX_HISTORY) {
                userHistory.splice(1, 2); 
            }

            if (botReply.length > 2000) {
                await interaction.editReply(botReply.substring(0, 1990) + "...");
            } else {
                await interaction.editReply(botReply);
            }

        } catch (e) {
            console.error("ERREUR OLLAMA :", e);
            await interaction.editReply("Mon cerveau est un peu lent... Réessaie dans un instant !");
        }
    },
};