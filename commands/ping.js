const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping') // ⚠️ OBLIGATOIRE
    .setDescription('Répond avec Pong!'),

  async execute(interaction) {
    await interaction.reply('Pong!');
  },
};
