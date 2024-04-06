const Discord = require('discord.js');
const { GatewayIntentBits, Partials, ActivityType } = require('discord.js');
require('dotenv').config();
const https = require('https')
const axios = require('axios');
const { createConnection } = require('mysql');
const cron = require('node-cron')


const con = createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
})

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
    con.connect((err) => {
        if (err) throw err;
        console.log('Connected to database!')
        con.query('CREATE TABLE IF NOT EXISTS power_usage (id INT AUTO_INCREMENT PRIMARY KEY, power INT)', (err, result) => {
            if (err) throw err;
            console.log('Table created')
        })
        con.query('CREATE TABLE IF NOT EXISTS temperature (id INT AUTO_INCREMENT PRIMARY KEY, temperature INT)', (err, result) => {
            if (err) throw err;
            console.log('Table created')
        })
    }
    )
    setInterval(() => {
        axiosInstance.get('/redfish/v1/Chassis/1/Power')
        .then(response => {
            con.query('INSERT INTO power_usage (power) VALUES (?)', [response.data.PowerControl[0].PowerConsumedWatts], (err, result) => {
                if (err) throw console.error(err);
            })
        })
        axiosInstance.get('/redfish/v1/Chassis/1/Thermal')
        .then(response => {
            con.query('INSERT INTO temperature (temperature) VALUES (?)', [response.data.Temperatures[0].ReadingCelsius], (err, result) => {
                if (err) throw console.error(err);
            })
        })
    }, 10000)
    cron.schedule('0 0 * * *', () => {
        con.query('DELETE FROM power_usage WHERE id NOT IN (SELECT id FROM (SELECT id FROM power_usage ORDER BY id DESC LIMIT 100) foo)', (err, result) => {
            if (err) throw console.error(err);
        })
        con.query('DELETE FROM temperature WHERE id NOT IN (SELECT id FROM (SELECT id FROM temperature ORDER BY id DESC LIMIT 100) foo)', (err, result) => {
            if (err) throw console.error(err);
        })
    })
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
    if (message.channel.id !== process.env.CHANNEL_ID || message.author.id !== process.env.USER_ID) return message.reply('You are not authorized to use this bot in this channel.')
    const [command, ...args] = message.content.slice(prefix.length).split(' ');
    
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
                { name: 'System', value: 'Check the system information of the server.' },
                { name: 'Help', value: 'Display this help menu.' },
                { name: 'Uptime', value: 'Check how long the bot has been online.' },
                { name: 'Powerchart', value: 'Display a chart of the power usage.' },
                { name: 'Tempchart', value: 'Display a chart of the temperature.' }
            )
            .setColor(Discord.Colors.Blue)
            .setTimestamp()
        ]})
    }
    
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

    if (command === 'uptime') {
        const uptime = process.uptime()
        const days = Math.floor(uptime / 86400)
        const hours = Math.floor(uptime / 3600) % 24
        const minutes = Math.floor(uptime / 60) % 60
        const seconds = Math.floor(uptime % 60)
        message.reply(`this bot has been online for ${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds.`)
    }

    const { ChartJSNodeCanvas } = require('chartjs-node-canvas')
    if (command === 'powerchart') {
        con.query('SELECT * FROM power_usage', (err, result) => {
            if (err) throw err;
            const data = result.map(row => row.power)
            const width = 800
            const height = 400
            const chartCallback = (ChartJS) => {
                ChartJS.defaults.color = 'white'
                ChartJS.defaults.font.size = 16
            }
            const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback })
            const configuration = {
                type: 'line',
                data: {
                    labels: Array.from({ length: data.length }, (_, i) => i),
                    datasets: [{
                        label: 'Power Usage',
                        data,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                }
            }
            chartJSNodeCanvas.renderToBuffer(configuration)
                .then(buffer => {
                    message.reply({ files: [buffer] })
                })
        })
    }
    if (command === 'tempchart') {
        con.query('SELECT * FROM temperature', (err, result) => {
            if (err) throw err;
            const data = result.map(row => row.temperature)
            const width = 800
            const height = 400
            const chartCallback = (ChartJS) => {
                ChartJS.defaults.color = 'white'
                ChartJS.defaults.font.size = 16
            }
            const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback })
            const configuration = {
                type: 'line',
                data: {
                    labels: Array.from({ length: data.length }, (_, i) => i),
                    datasets: [{
                        label: 'Temperature',
                        data,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                }
            }
            chartJSNodeCanvas.renderToBuffer(configuration)
                .then(buffer => {
                    message.reply({ files: [buffer] })
                })
        })
    }
});


client.login(process.env.BOT_TOKEN);

