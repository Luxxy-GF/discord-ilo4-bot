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

## Usage
- `!status` - Get the power status of the server
- `!start` - Power on the server
- `!stop` - Power off the server

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
```
## Bugs
- [ ] Fix the bug where the bot crashes when the ILO server is not reachable