/**
 * Module Imports
 */
require('dotenv').config();
const { REST } = require('@discordjs/rest');
const chalk = require('chalk');
const { Routes } = require('discord-api-types/v9');
const { TOKEN, clientId, guildId } = require('./util/config');
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { readdirSync } = require("fs");
const client = new Client({
    disableMentions: "everyone",
    restTimeOffset: 0,
    intents: [
        GatewayIntentBits.Guilds,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
client.login(TOKEN);
client.commands = new Collection();

/**
 * Import all commands
 */
const commands = []
const commandFiles = readdirSync(`./commands/`).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    const cmd = {
        name: command.name,
        description: command.description,
        type: command.type,
        options: command.options,
    };
    if (["MESSAGE", "USER"].includes(command.type)) delete command.description;
    commands.push(cmd)
    client.commands.set(command.name, command);
}

const basicCommands = require("./commands.json")

basicCommands.forEach((command) => {
    const cmd = {
        name: command.name,
        description: command.description,
    };
    commands.push(cmd)
})
const rest = new REST({ version: '9' }).setToken(TOKEN);

(async () => {
    try {
        console.log(chalk.green("Started refreshing application (/) commands."));
        console.log("Submitting guild commands")
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );
        console.log(chalk.green("Successfully reloaded application (/) commands."));
    } catch (error) {
        console.error(error);
    }
})();


client.on('ready', async (client) => {
    console.log(`${client.user.username} ready!`);
})
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    const commandName = interaction.commandName;

    const commands = require("./commands.json")
    let acknowledged = false;

    await commands.forEach((cmd) => {
        if (cmd.name == commandName) {
            interaction.reply(cmd.response)
            acknowledged = true;
        }
    })
    if (acknowledged == false) {
        const command = interaction.client.commands.get(commandName)
        try {
            command.execute(interaction);
        } catch (error) {
            console.error(error);
            interaction.reply({ ephemeral: true, content: "An error occurred \n```" + error.message + "```" }).catch(console.error);
        }
    }
})
