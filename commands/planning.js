const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const ical = require('ical');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('planning') // ⚠️ OBLIGATOIRE
    .setDescription('Affiche le planning de la semaine'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const url = 'https://edt.univ-littoral.fr/jsp/custom/modules/plannings/rynAGd3w.shu';
      const response = await fetch(url);
      const body = await response.text();

      const events = ical.parseICS(body);
      let message = '';

      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // lundi
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // dimanche

      for (let k in events) {
        const ev = events[k];
        if (ev.start >= startOfWeek && ev.start <= endOfWeek) {
          message += `📚 ${ev.summary}\n🕒 ${ev.start.toLocaleString()} - ${ev.end.toLocaleString()}\n📍 ${ev.location || 'Lieu non précisé'}\n\n`;
        }
      }

      if (!message) {
        message = "⚠️ Aucun cours trouvé pour cette semaine.";
      }

      await interaction.editReply(message);
    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Erreur lors de la récupération du planning.');
    }
  },
};
