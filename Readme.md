## Discord ilo - A Discord bot for ILO
This bot is designed to help you manage your ILO server.

## Features
- [x] Power on
- [x] Power off
- [x] Power reset
- [x] Power status

## Installation
1. Clone the repository
2. Install the requirements
3. Create a .env file with the following content:
```
DISCORD_TOKEN=your_discord_token
ILO_HOST=your_ilo_host
ILO_USER=your_ilo_user
ILO_PASSWORD=your_ilo_password
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