import {
    Client,
    GatewayIntentBits,
    ChannelType,
  } from "discord.js";
  import dotenv from "dotenv";
  

  dotenv.config();
  
  // Create a client instance with necessary intents
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.MessageContent,
    ],
  });
  
  const INITIAL_COOLDOWN = 50 * 1000; // 50 seconds initial cooldown
  let cooldown = INITIAL_COOLDOWN;
  
  // In-memory storage for cooldowns (last message timestamps) for users
  const userCooldowns = new Map();
  
  // Function to send a DM with rate-limit handling and adaptive cooldown
  async function sendDM(member, message) {
    try {
      // Send DM to user
      await member.send(message);
      console.log(`DM sent to ${member.user.tag}`);
  
      // Reset cooldown on successful message
      cooldown = INITIAL_COOLDOWN;
    } catch (error) {
      if (error.code === 50007) {
        // Cannot send DM to this user (not friends or blocked)
        console.error(`Cannot send DM to ${member.user.tag}: ${error.message}`);
      } else if (error.code === 20026) {
        // Bot flagged for spam, stop operations
        console.error(
          `Bot flagged for spam. Pausing all DM operations: ${error.message}`,
        );
        await pauseBotOperations();
      } else {
        // Handle other types of errors (e.g., rate limits)
        console.error(`Error sending DM to ${member.user.tag}: ${error.message}`);
        increaseCooldown();
      }
    }
  }
  
  // Function to increase cooldown exponentially
  function increaseCooldown() {
    cooldown = Math.min(cooldown * 2, 10 * 60 * 1000); // Max cooldown: 10 minutes
    console.log(`Increased cooldown to ${cooldown / 1000} seconds`);
  }
  
  // Function to pause bot operations when flagged
  async function pauseBotOperations() {
    console.log("Pausing bot operations due to spam flag.");
    await client.destroy();
  }
  
  // Start the bot
  client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);
  
    // Get all the guilds (servers) the bot has joined
    const guilds = client.guilds.cache;
  
    // Iterate through all the guilds the bot has joined
    guilds.forEach(async (guild) => {
      console.log(`Processing guild: ${guild.name}`);
  
      try {
        // Fetch all channels where the bot has permission to send messages
        const availableChannels = guild.channels.cache
          .filter(
            (channel) =>
              channel.type === ChannelType.GuildText && // Only text channels
              channel.permissionsFor(guild.members.me).has("SendMessages"), // Bot must have permission to send messages
          )
          .random(3); // Randomly select 3 channels from the available ones
  
        // Log the selected channels
        availableChannels.forEach((channel) =>
          console.log(`Selected channel: ${channel.name}`),
        );
  
        // Fetch all members of the guild
        const members = await guild.members.fetch();
  
        // Start an interval to send messages every 50 seconds
        setInterval(async () => {
          // Send ad messages to the selected channels
          availableChannels.forEach(async (channel) => {
            try {
              // Post an ad message in each selected channel
              await channel.send(
                "Sorry for this DMs.🤓 we are testing our school project.🎓 Have a great day !",
              );
              console.log(`Ad message posted in channel: ${channel.name}`);
            } catch (error) {
              console.error(
                `Couldn't post message in channel ${channel.name}:`,
                error,
              );
            }
          });
  
          // Send DMs to random users who aren't bots
          for (const [id, member] of members) {
            if (member.user.bot) continue; // Skip bots
  
            const lastMessageTime = userCooldowns.get(member.user.id) || 0;
            const currentTime = Date.now();
  
            // Check if the cooldown period has passed for this user
            if (currentTime - lastMessageTime >= cooldown) {
              // Send a unique DM if the cooldown has expired
              try {
                await sendDM(
                  member,
                  `Hello ${member.user.username}, this is a unique message from the bot!`,
                );
                console.log(`Sent a message to ${member.user.tag}`);
  
                // Update the last message time for this user
                userCooldowns.set(member.user.id, currentTime);
              } catch (error) {
                if (error.code === 50007) {
                  console.error(
                    `Cannot send DM to ${member.user.tag}: Not friends or DM permissions restricted`,
                  );
                } else {
                  console.error(`Couldn't send DM to ${member.user.tag}:`, error);
                }
              }
            } else {
              const remainingTime = Math.ceil(
                (cooldown - (currentTime - lastMessageTime)) / 1000,
              );
              console.log(
                `${member.user.tag} is on cooldown. ${remainingTime} seconds remaining.`,
              );
            }
          }
        }, cooldown); // Cooldown between messages
      } catch (error) {
        console.error("Error fetching channels or sending messages:", error);
      }
    });
  });
  

  client.login(process.env.BOT_TOKEN);