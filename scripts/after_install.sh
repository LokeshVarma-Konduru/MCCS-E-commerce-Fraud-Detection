#!/bin/bash
cd /home/ec2-user/app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build
