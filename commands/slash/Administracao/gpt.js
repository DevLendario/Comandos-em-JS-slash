const { ApplicationCommandType, EmbedBuilder } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: "sua api key aqui"
});
const openai = new OpenAIApi(configuration);

module.exports = {
  name: "gpt",
  description: "Pergunte algo para o ChatGPT",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "pergunta",
      description: "Sua pergunta",
      type: 3,
      required: true
    }
  ],
  permissions: [],
  run: async (bot, interaction) => {
    const pergunta = interaction.options.getString("pergunta");
    await interaction.deferReply({ ephemeral: true });

    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: pergunta }]
      });

      const resposta = response.data.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setColor("#810ce8")
        .setTitle("Resposta do ChatGPT")
        .setDescription(resposta);

      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      await interaction.editReply({ content: "Erro ao consultar a IA.", ephemeral: true });
    }
  }
}