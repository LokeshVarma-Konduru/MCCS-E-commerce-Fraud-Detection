#!/bin/bash
cd /home/ec2-user/app

# Start backend with PM2
cd backend
pm2 start index.js

# You might want to setup nginx for serving the frontend
# This is a basic setup, you might need to adjust based on your needs
sudo cp -r ../frontend/dist/* /var/www/html/
