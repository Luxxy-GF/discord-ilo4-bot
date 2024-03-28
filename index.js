const Discord = require('discord.js');
const { GatewayIntentBits, Partials, ActivityType } = require('discord.js');
require('dotenv').config();
const https = require('https')
const axios = require('axios');
const { get } = require('http');


const agent = new https.Agent({
    rejectUnauthorized: false
});
const axiosInstance = axios.create({
    httpsAgent: agent,
    baseURL: process.env.ILO_URL,
    auth: {
        username: process.env.ILO_USER,
        password: process.env.ILO_PASS
    }
})

const prefix = process.env.PREFIX;

const client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
})


const getPowerState = () => {
    return axiosInstance.get('/redfish/v1/systems/1')
    .then(response => response.data.PowerState)
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    setInterval(() => {
        axiosInstance.get('/redfish/v1/systems/1')
        .then(response => {
            axiosInstance.get('/redfish/v1/Chassis/1/Power')
            .then(r => {
                if (response.data.PowerState === 'On') {
                    client.user.setActivity({
                        name: `Power Usage: ${r.data.PowerControl[0].PowerConsumedWatts}W`,
                        type: ActivityType.Custom
                    })
                } else {
                    client.user.setActivity({
                        name: 'Server is Off',
                        type: ActivityType.Custom
                    })
                }
            })
        })
    }, 10000)
});

const logError = (msg, error) => {
    console.error(error.message)
    msg.reply('Something went wrong, check the captains log.')
}

const startServer = (state) => {
    if (state === 'On') return 'Server is already powered on!'
    return axiosInstance.post('/redfish/v1/systems/1', { Action: 'Reset', ResetType: 'On' })
        .then(() => 'Initiating Power Sequence.. ⚡')
}

const stopServer = (state) => {
    if (state === 'Off') return 'Server is already powered off!'
    return axiosInstance.post('/redfish/v1/systems/1', { Action: 'Reset', ResetType: 'PushPowerButton' })
        .then(() => 'Initiating Power Down! ⚡')
}

const getPowerUsage = () => {
    return axiosInstance.get('/redfish/v1/Chassis/1/Power')
        .then(response => response.data.PowerControl[0].PowerConsumedWatts)
}

const getTermialOutput = () => {
    return axiosInstance.get('/redfish/v1/Chassis/1/Thermal')
        .then(response => response.data.Temperatures[0].ReadingCelsius)
}

const getSystem = () => {
    return axiosInstance.get('/redfish/v1/systems/1')
        .then(response => response.data)
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    if (!message.channel.id === process.env.CHANNEL_ID) return;
    const [command, ...args] = message.content.slice(prefix.length).split(' ');

    if (command === 'ping') {
        message.reply('Pong!');
    }

    if (command === 'status') {
        getPowerState()

            .then(state => message.reply({ embeds: [ 
                new Discord.EmbedBuilder()
                .setTitle('Server Status')
                .addFields({ name: 'Power State', value: state})
                .setColor(state === 'On' ? Discord.Colors.Green : Discord.Colors.Red)
                .setTimestamp()
            ]}))
            .catch(error => logError(message, error))
    }

    if (command === 'start') {
        getPowerState()
            .then(state => startServer(state))
            .then(response => message.reply(response))
            .catch(error => logError(message, error))
    }

    if (command === 'stop') {
        getPowerState()
            .then(state => stopServer(state))
            .then(response => message.reply(response))
            .catch(error => logError(message, error))
    }

    if (command === 'power') {
        getPowerUsage()
            .then(usage => message.reply({ embeds: [
                new Discord.EmbedBuilder()
                .setTitle('Power Usage')
                .addFields({ name: 'Power Consumption', value: `${usage} Watts`})
                .setColor(Discord.Colors.Blue)
                .setTimestamp()
            ]}))
            .catch(error => logError(message, error))
    }

    if (command === 'temp') {
        getTermialOutput()
            .then(temp => message.reply({ embeds: [
                new Discord.EmbedBuilder()
                .setTitle('Temperature')
                .addFields({ name: 'Temperature', value: `${temp}°C`})
                .setColor(Discord.Colors.Blue)
                .setTimestamp()
            ]}))
            .catch(error => logError(message, error))
    }

    if (command === 'system') {
        getSystem()
            .then(system => message.reply({ embeds: [
                new Discord.EmbedBuilder()
                .setTitle('System Information')
                .addFields(
                    { name: 'Manufacturer ', value: system.Manufacturer },
                    { name: 'Model', value: system.Model },
                    { name: 'Serial Number', value: system.SerialNumber },
                    { name: 'UUID', value: system.UUID }
                )
                .setColor(Discord.Colors.Blue)
                .setTimestamp()
            ]}))
            .catch(error => logError(message, error))
    }

    if (command === 'help') {
        message.reply({ embeds: [
            new Discord.EmbedBuilder()
            .setTitle('Help Menu')
            .addFields(
                { name: 'Status', value: 'Check the current power state of the server.' },
                { name: 'Start', value: 'Power on the server.' },
                { name: 'Stop', value: 'Power off the server.' },
                { name: 'Power', value: 'Check the current power usage of the server.' },
                { name: 'Temp', value: 'Check the current temperature of the server.' },
                { name: 'System', value: 'Check the system information of the server.' }
            )
            .setColor(Discord.Colors.Blue)
            .setTimestamp()
        ]})
    }
});


client.login(process.env.BOT_TOKEN);

