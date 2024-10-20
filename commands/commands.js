import { REST, Routes } from "discord.js";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  {
    name: "hello",
    description: "Says hello!",
  },
  {
    name: "bye",
    description: "Says bye!",
  },
  {
    name: "user",
    description: "Provides information about the user.",
  },
];

// Function to register commands
export async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_BOT_TOKEN,
  );

  try {
    console.log("Started refreshing application (/) commands.");

    // Register commands
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      {
        body: commands,
      },
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}
