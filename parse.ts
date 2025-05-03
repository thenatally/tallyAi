// save as format.js and run with: node format.js

import fs from "fs";

const raw:any = JSON.parse(fs.readFileSync("messages.json", "utf-8"));

const result = raw.map((entry: { before: any[]; ref: { author: { name: any; }; content: any; }; Contents: string; }) => {
  const context = entry.before.map(
    msg => `${msg.author.name}: ${msg.content}`
  );

  let input = context.join("\n");

  if (entry.ref) {
    input += `\n\n[In reply to ${entry.ref.author.name}: ${entry.ref.content}]`;
  }

  return {
    instruction: "Reply to this message using the context below.",
    input,
    output: entry.Contents.trim()
  };
});

// write to JSONL
const jsonl = result.map((x: any) => JSON.stringify(x)).join("\n");
fs.writeFileSync("finetune_data.jsonl", jsonl);

console.log("✨ Converted to finetune_data.jsonl");
