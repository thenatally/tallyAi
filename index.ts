import express from "express";
import { spawn } from "child_process";

const app = express();
const port = 3000;

app.use(express.json());

interface ChatMessage {
  username: string;
  message: string;
}

const personaPrompt = `
reply to this
`;
//@ts-ignore
app.post("/generate", (req, res) => {
  const chatHistory: ChatMessage[] = req.body;

  if (!Array.isArray(chatHistory)) {
    return res
      .status(400)
      .json({ error: "Expected an array of chat messages" });
  }
  console.log("Received chat history:", chatHistory);
  const formattedChat = chatHistory
    .map((m) => `<|prompt|>${m.username}: ${m.message}<|prompt|>`)
    .join("\n");

  const finalPrompt =
    personaPrompt + "\n" + formattedChat + "\n<|prompt|>tally.gay:";

  const command = "/home/tally/llama.cpp/build/bin/llama-cli";
  const args = [
    "-m",
    "/home/tally/llama.cpp/models/phi-2/phi-2.Q4_K_M.gguf",
    "-t",
    "4",
    "-p",
    finalPrompt,
  ];

  const llama = spawn(command, args);

  let output = "";
  let errorOutput = "";

  llama.stdout.on("data", (data) => {
    output += data.toString();
  });

  llama.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  llama.on("error", (err) => {
    console.error("Failed to start llama process:", err);
    return res.status(500).json({ error: "Failed to start model" });
  });

  llama.on("close", (code) => {
    if (code === 0) {
      console.log("llama output:", output);
      const match = output.match(/<\|prompt\|>tally\.gay:\s*(.*)/s);
      const reply = match ? match[1]?.trim() : output.trim();
      res.json({ response: reply });
    } else {
      res
        .status(500)
        .json({ error: errorOutput || `llama exited with code ${code}` });
    }
  });
});

app.listen(port, () => {
  console.log(`🦙 tallybot API ready at http://localhost:${port}`);
});
