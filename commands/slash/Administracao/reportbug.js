const { EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder } = require("discord.js");

module.exports = {
  name: "reportbug",
  description: "『Utilidade』Reporte um bug do bot",
  type: ApplicationCommandType.ChatInput,
  options: [],
  permissions: [],
  run: async (bot, interaction) => {
    // Embed visível para todos
    const embed = new EmbedBuilder()
      .setColor("#810ce8")
      .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
      .setTitle(`<:roblox:1402502134620225688>  | Reportar um Bug`)
      .setDescription("Clique no botão abaixo para reportar um bug.")
      .setFooter({ text: `Todos os direitos reservados, ${interaction.guild.name}` });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_modal_bug')
          .setLabel('Reportar Bug')
          .setStyle('2')
      );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
  }
}