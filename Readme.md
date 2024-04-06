## Discord ilo - A Discord bot for ILO
This bot is designed to help you manage your ILO server.

## How it works
The bot uses the ILO API to communicate with the server. It sends a request to the ILO server every 5 seconds to get the power status, temperature, fan speed, and power usage. The bot also stores the power usage in a MySQL database to create a power usage chart.

## Issues and feature requests
If you have any issues or feature requests, please create an issue on the [issues page](https://github.com/luxxy-gf/discord-ilo-bot/issues)

## Photos
![image](https://media.discordapp.net/attachments/1117555415559974963/1226189204288180274/image.png?ex=6623dcaf&is=661167af&hm=0da4e2b2085d2bff1abe356e3cc959afd62ea53e65b3561f32d3edec3c28bdac&=&format=webp&quality=lossless&width=800&height=676)
## Features
- [x] Power on
- [x] Power off
- [x] Power reset
- [x] Power status
- [x] Get the temperature
- [x] Get the fan speed
- [x] Get the power usage
- [ ] Get the server health

## Requirements
- Node.js (v16.6.0 or higher)
- MySql Server (For the power charts)

## Installation
1. Clone the repository
2. Install the requirements
3. Create a .env file with the following content:
```
DISCORD_TOKEN=your_discord_token
ILO_HOST=your_ilo_host
ILO_USER=your_ilo_user
ILO_PASSWORD=your_ilo_password
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name
```
4. Run the bot
```bash
node index.js
```

## Docker Installation
```bash
docker run -d --name discord-ilo \
    -e DISCORD_TOKEN=your_discord_token \
    -e ILO_HOST=your_ilo_host \
    -e ILO_USER=your_ilo_user \
    -e ILO_PASSWORD=your_ilo_password \
    -e DB_HOST=your_db_host \
    -e DB_USER=your_db_user \
    -e DB_PASS=your_db_password \
    -e DB_NAME=your_db_name \
    --restart unless-stopped \
    ghcr.io/luxxy-gf/discord-ilo-bot:latest
```
or use the docker-compose file
```yaml
version: '3.7'
services:
  discord-ilo:
    image: ghcr.io/luxxy-gf/discord-ilo-bot:latest
    container_name: discord-ilo
    environment:
      - DISCORD_TOKEN=your_discord_token
      - ILO_HOST=your_ilo_host
      - ILO_USER=your_ilo_user
      - ILO_PASSWORD=your_ilo_password
      - DB_HOST=your_db_host
      - DB_USER=your_db_user
      - DB_PASS=your_db_password
      - DB_NAME=your_db_name
    restart: unless-stopped
```

## Usage
- `!status` - Get the power status of the server
- `!start` - Power on the server
- `!stop` - Power off the server

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Bugs
- [ ] Fix the bug where the bot crashes when the ILO server is not reachable
- [ ] Maybe the bot adding to much data to the database as it queries the ILO server every 5 seconds