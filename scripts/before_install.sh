#!/bin/bash
# Install node and npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 16
nvm use 16

# Install PM2 globally
npm install pm2 -g
