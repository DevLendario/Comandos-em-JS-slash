const client = require("../../../index");
const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  EmbedBuilder, 
  ButtonBuilder, 
  InteractionType 
} = require("discord.js");
const moment = require('moment-timezone');

client.on('interactionCreate', async (interaction) => {
  // Ignorar interações de giveaway
  if (interaction.isButton() && interaction.customId.startsWith('giveaway_')) return;
  
  // Abrir modal ao clicar no botão
  if (interaction.isButton() && interaction.customId === 'abrir_modal_bug') {
    const modal = new ModalBuilder()
      .setCustomId('modal_reportar_bug')
      .setTitle('Reportar Bug');

    const bugInput = new TextInputBuilder()
      .setCustomId('bug_descricao')
      .setLabel('Descreva o bug')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const comentarioInput = new TextInputBuilder()
      .setCustomId('bug_comentario')
      .setLabel('Comentário adicional')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const imagemInput = new TextInputBuilder()
      .setCustomId('bug_imagem')
      .setLabel('Link da imagem do bug')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(bugInput),
      new ActionRowBuilder().addComponents(comentarioInput),
      new ActionRowBuilder().addComponents(imagemInput)
    );

    return await interaction.showModal(modal);
  }

  // Receber dados do modal e enviar embed
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_reportar_bug') {
    const bug = interaction.fields.getTextInputValue('bug_descricao');
    const comentario = interaction.fields.getTextInputValue('bug_comentario') || "Nenhum comentário";
    const imagem = interaction.fields.getTextInputValue('bug_imagem');

    const embed = new EmbedBuilder()
      .setColor("#810ce8")
      .setTitle(`❌ | Novo Bug descoberto!`)
      .addFields(
        {
          name: '⭐ | Denunciante:',
          value: `\`\`\`${interaction.user.username}\`\`\``,
          inline: false
        },
        {
          name: '🚧 | Bug denunciado:',
          value: `\`\`\`${bug}\`\`\``,
          inline: true
        },
        {
          name: '📝 | Comentário:',
          value: `\`\`\`${comentario}\`\`\``,
          inline: true
        },
        {
          name: '🕐 | Data de emissão',
          value: `\`\`\`${moment().utc().tz('America/Sao_Paulo').format('DD/MM/Y - HH:mm:ss')}\`\`\``
        },
        {
          name: '🔖 | Status:',
          value: '`Pendente`',
          inline: true
        }
      );

    if (imagem) {
      embed.setImage(imagem);
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('importante')
          .setLabel('Importante')
          .setStyle('1'),
        new ButtonBuilder()
          .setCustomId('resolvido')
          .setLabel('Resolvido')
          .setStyle('3'),
        new ButtonBuilder()
          .setCustomId('negado')
          .setLabel('Negado')
          .setStyle('4'),
      );

    try {
      const sent = await interaction.guild.channels.cache
        .get("1411502727061573702")
        .send({ embeds: [embed], components: [row] });

      // Salva o ID do autor do bug na mensagem para uso posterior
      sent.bugAuthorId = interaction.user.id;

      await interaction.reply({
        content: "Bug reportado com sucesso! Aguarde a análise da equipe.",
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Houve um erro ao enviar seu relatório. Tente novamente mais tarde.",
        ephemeral: true,
      });
    }
  }

  // Botões de status
  if (interaction.isButton() && ['importante', 'resolvido', 'negado'].includes(interaction.customId)) {
    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    let status = '';
    let color = '#810ce8';
    let newRow;

    if (interaction.customId === 'importante') {
      status = 'Importante';
      color = '#ffd700';

      // Marcar o cargo dos developers dentro da embed
      const devRoleId = '1402452116328677507'; // Troque pelo ID do cargo dos developers
      const mentionFieldIndex = embed.data.fields.findIndex(f => f.name.includes('👨‍💻 | Developers'));
      if (mentionFieldIndex !== -1) {
        embed.data.fields[mentionFieldIndex].value = `<@&${devRoleId}> Este bug foi marcado como importante!`;
      } else {
        embed.addFields({
          name: '👨‍💻 | Developers',
          value: `<@&${devRoleId}> Este bug foi marcado como importante!`,
          inline: false
        });
      }

      // Remove o botão de importante, mantém resolvido e negado
      newRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('resolvido')
            .setLabel('Resolvido')
            .setStyle('3'),
          new ButtonBuilder()
            .setCustomId('negado')
            .setLabel('Negado')
            .setStyle('4')
        );
    }
    if (interaction.customId === 'resolvido') {
      status = '🟢 Resolvido';
      color = '#43b581';

      // Remove todos os botões
      await interaction.update({ embeds: [embed.setFields(embed.data.fields.map(f => f.name.includes('Status') ? { ...f, value: `\`${status}\`` } : f)).setColor(color)], components: [] });
    }
    if (interaction.customId === 'negado') {
      status = '🔴 Negado';
      color = '#f04747';

      // Remove todos os botões
      await interaction.update({ embeds: [embed.setFields(embed.data.fields.map(f => f.name.includes('Status') ? { ...f, value: `\`${status}\`` } : f)).setColor(color)], components: [] });
    }

    // Se for importante, atualiza embed e mantém botões resolvido/negado
    if (interaction.customId === 'importante') {
      const fields = embed.data.fields.map(f => {
        if (f.name.includes('Status')) {
          return { ...f, value: `\`${status}\`` };
        }
        return f;
      });
      embed.setFields(fields).setColor(color);
      await interaction.update({ embeds: [embed], components: [newRow] });
    }

    // Envia DM para o autor do bug
    if (['resolvido', 'negado'].includes(interaction.customId)) {
      const denuncianteField = embed.data.fields.find(f => f.name.includes('Denunciante'));
      let userTag = denuncianteField ? denuncianteField.value.replace(/`/g, '').replace(/\n/g, '').trim() : null;
      let user = interaction.guild.members.cache.find(m => m.user.username === userTag);

      // Se não encontrar pelo username, tenta pelo id salvo (se você salvar o id em algum lugar)
      if (!user) {
        // Se você salvar o id do autor na mensagem, pode buscar aqui
        // Exemplo: let user = await interaction.guild.members.fetch(interaction.message.bugAuthorId);
      }

      if (user) {
        try {
          const dmEmbed = new EmbedBuilder()
            .setColor(color)
            .setTitle(status)
            .setDescription(
              interaction.customId === 'resolvido'
                ? 'Seu bug foi marcado como resolvido! Obrigado por ajudar o servidor.'
                : 'Seu bug foi negado. Caso ache que foi um erro, envie novamente ou entre em contato com a staff.'
            )
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

          const dmRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Ir para o servidor')
                .setStyle('5')
                .setURL(`https://discord.com/channels/${interaction.guild.id}`)
            );

          await user.send({ embeds: [dmEmbed], components: [dmRow] });
        } catch (e) {
          // Usuário não permite DM
        }
      }
    }
  }
});