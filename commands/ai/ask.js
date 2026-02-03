const { SlashCommandBuilder, Collection } = require('discord.js');
const { Ollama } = require('ollama');

const ollamaInstance = new Ollama({ host: 'http://127.0.0.1:11434' });
const sessions = new Map();
const cooldowns = new Collection();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Discute avec l\'IA')
        .addStringOption(option => option.setName('question').setRequired(true).setDescription('Ta question')),

    async execute(interaction) {
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownAmount = 5 * 1000;

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({ 
                    content: `Doucement ! Attends encore ${timeLeft.toFixed(1)} secondes avant de me reposer une question.`, 
                    ephemeral: true
                });
            }
        }
        
        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), cooldownAmount);
        await interaction.deferReply();
        
        try {
            if (!sessions.has(userId)) {
                sessions.set(userId, [{ role: 'system', content: 'Tu es un pote gamer discret et sécurisant.' }]);
            }
            let history = sessions.get(userId);
            history.push({ role: 'user', content: interaction.options.getString('question') });

            const response = await ollamaInstance.chat({
                model: process.env.OLLAMA_MODEL || 'llama3',
                messages: history,
            });

            history.push({ role: 'assistant', content: response.message.content });
            if (history.length > 10) history.splice(1, 2);

            await interaction.editReply(response.message.content);
        } catch (e) {
            console.error(e);
            await interaction.editReply("Erreur technique. Mon processeur est peut-être trop occupé.");
        }
    },
};