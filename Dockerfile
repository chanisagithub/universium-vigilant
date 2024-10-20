# Use the official Node.js 16 image from Docker Hub
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files into the container
COPY package*.json ./

# Install the dependencies defined in package.json
RUN npm install

# Copy the rest of your application code into the container
COPY . .

# Specify the command to run your bot when the container starts
CMD ["node", "bot.js"]