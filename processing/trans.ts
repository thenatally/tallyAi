//@ts-nocheck
import { json as raw } from "./json.js";
const json = raw.slice(0, 1000)
import {
  APIMessage,
  Client,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import fs from "fs";
const TOKEN = process.env.BOT;
const CHANNEL_ID = "1141222490597757025"; 

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const rest = new REST({ version: "10" }).setToken(TOKEN!);

client.once("ready", async () => {
  console.log("Logged in as " + client.user!.tag);

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel || !channel.isTextBased()) {
    console.error("Channel not found or not a text channel.");
    return;
  }
  console.log("Channel fetched successfully.");

  const totalMessages = json.length;
  console.log(`Total messages to process: ${totalMessages}`);

  
  const startTime = Date.now();
  let completed = 0;
  const newJson: any[] = [];

  
  for (const msg of json
    .sort(
      (a: { Timestamp: string | number | Date; }, b: { Timestamp: string | number | Date; }) =>
        new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
    )
  ) {
    try {
      
      const message = (await rest.get(
        Routes.channelMessage(CHANNEL_ID, msg.ID)
      )) as APIMessage;

      
      const before = (await rest.get(
        (Routes.channelMessages(CHANNEL_ID) +
          "?limit=4&before=" +
          msg.ID) as any
      )) as APIMessage[];

      
      let extra: any = {};
      if (message.message_reference) {
        const ref = message.message_reference;
        try {
          const refMessage = (await rest.get(
            Routes.channelMessage(CHANNEL_ID, ref.message_id!)
          )) as APIMessage;
          extra = {
            ref: {
              content: refMessage.content,
              author: {
                name: refMessage.author.username,
                id: refMessage.author.id,
              },
            },
          };
        } catch (refError) {
          console.error(`Failed to fetch reference message: ${refError}`);
        }
      }

      
      newJson.push({
        ...msg,
        before: before.map((m) => ({
          author: { name: m.author.username, id: m.author.id },
          content: m.content,
        })),
        ...extra,
      });
    } catch (error) {
      console.error(`Failed to fetch message or preceding messages: ${error}`);
    }

    
    completed++;
    const elapsedMs = Date.now() - startTime;
    const avgPerMsg = elapsedMs / completed;
    const remaining = totalMessages - completed;
    const etaMs = avgPerMsg * remaining;

    const etaSec = Math.round(etaMs / 1000);
    const etaMin = Math.floor(etaSec / 60);
    const etaRemSec = etaSec % 60;
    const etaStr = `${etaMin}m ${etaRemSec}s`;

    console.log(
      `Processed ${completed}/${totalMessages} — ${(completed / totalMessages * 100).toFixed(2)}% — ETA: ${etaStr}`
    );
  }

  
  fs.writeFileSync("messages.json", JSON.stringify(newJson, null, 2));
  console.log("Messages saved to messages.json! 🎉");

  client.destroy();
});

client.login(TOKEN);
