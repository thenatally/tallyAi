import { Client, Message, GatewayIntentBits } from 'discord.js';


const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const messageCache = new Map<string, Message[]>(); // per-channel msg history
const MAX_HISTORY = 10;
const API_URL = 'http://localhost:3000/generate';

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return; // ignore bots
  if (!msg.guild) return; // only in servers
  console.log(`Received message: ${msg.content} from ${msg.author.username}`);
  // keep history
  const history = messageCache.get(msg.channel.id) || [];
  history.push(msg);
  if (history.length > MAX_HISTORY) history.shift();
  messageCache.set(msg.channel.id, history);

  // if bot is mentioned or someone says "tally.gay", respond
  // const shouldRespond = msg.mentions.has(client.user!) || msg.content.includes('tally.gay');

  // if (!shouldRespond) return;

  try {
    // build chat array
    const chat = history.map((m) => ({
      username: m.author.username,
      message: m.content,
    }));

    // send to your llama API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chat),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Llama API error:', err);
      return msg.channel.send('llama brok :(');
    }

    const data = await response.json() as any;
    const reply = data.response || 'meow?';

    await msg.channel.send(reply);
  } catch (err) {
    console.error('Error calling llama API:', err);
    msg.channel.send('error mrowing :<');
  }
});

client.login(process.env.DISCORD_TOKEN);
