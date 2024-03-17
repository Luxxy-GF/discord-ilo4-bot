const Discord = require('discord.js');
const { GatewayIntentBits, Partials } = require('discord.js');
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

const prefix = '!';

const client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildInvites,
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
            client.user.setActivity(response.data.PowerState, { type: 'WATCHING' });
        })
    }, 10000)
});

const logError = (msg, error) => {
    console.error(error.message)
    msg.channel.send('Something went wrong, check the captains log.')
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
            .then(state => message.reply(`Server is currently **${state}**`))
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
});


client.login(process.env.BOT_TOKEN);

