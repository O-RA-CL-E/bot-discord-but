module.exports = {
  name: "prochain_ds",
  description: "Affiche la date du prochain DS",
  executeMessage(message) {
    message.channel.send("📝 Prochain DS : 15 septembre (Algorithmique)");
  },
  executeSlash(interaction) {
    interaction.reply("📝 Prochain DS : 15 septembre (Algorithmique)");
  }
};
