import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.USER_TOKEN;
const guildId = process.env.GUILD_ID;
const targetChannelId = process.env.TARGET_CHANNEL_ID;
const INITIAL_COOLDOWN = 50 * 1000; // 50 seconds
let cooldown = INITIAL_COOLDOWN;

// Track last interaction times for cooldown
const userCooldowns = new Map();

const ws = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");

ws.on("open", () => {
  console.log("Connected to Discord Gateway");

  ws.send(
    JSON.stringify({
      op: 2, // IDENTIFY
      d: {
        token: token,
        intents: 32768 | 16384 | 1 | 512, // GUILD_MEMBERS, DIRECT_MESSAGE_TYPING, GUILDS, GUILD_MESSAGES
        properties: {
          $os: "linux",
          $browser: "chrome",
          $device: "desktop",
        },
      },
    })
  );
});

ws.on("message", (data) => {
  const payload = JSON.parse(data);
  const { t, d, op } = payload;

  if (op === 10) {
    const { heartbeat_interval } = d;
    setInterval(() => {
      ws.send(JSON.stringify({ op: 1, d: null }));
    }, heartbeat_interval);
  }

  if (t === "READY") {
    console.log("Authenticated successfully!");
    ws.send(
      JSON.stringify({
        op: 8, // REQUEST_GUILD_MEMBERS
        d: {
          guild_id: guildId,
          query: "",
          limit: 0,
        },
      })
    );
  }

  if (t === "MESSAGE_CREATE") {
    const { author, content, channel_id } = d;

    if (channel_id === targetChannelId) {
      const userId = author.id;

      // Cooldown logic
      const lastMessageTime = userCooldowns.get(userId) || 0;
      const currentTime = Date.now();

      // If cooldown has passed, send a new message
      if (currentTime - lastMessageTime >= cooldown) {
        console.log(`[Target Channel] ${author.username}: "${content}"`);

        // Update the last message time for the user
        userCooldowns.set(userId, currentTime);

        // Reset cooldown to the initial value after each successful message
        cooldown = INITIAL_COOLDOWN;
      } else {
        // Calculate remaining cooldown time
        const remainingTime = Math.ceil(
          (cooldown - (currentTime - lastMessageTime)) / 1000
        );
        console.log(
          `${author.username} is on cooldown. ${remainingTime} seconds remaining.`
        );

        // Increase cooldown time on frequent messages
        increaseCooldown();
      }
    }
  }
});

function increaseCooldown() {
  cooldown = Math.min(cooldown * 2, 10 * 60 * 1000); // Max cooldown: 10 minutes
  console.log(`Cooldown increased to ${cooldown / 1000} seconds.`);
}

ws.on("error", (error) => {
  console.error("WebSocket Error:", error);
});

ws.on("close", (code, reason) => {
  console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
});