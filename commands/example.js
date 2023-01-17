module.exports = {
    name: "info",
    description: "Information about the bot",
    async execute(interaction) {
        interaction.reply({ content: "This is the info command." });
    }
};