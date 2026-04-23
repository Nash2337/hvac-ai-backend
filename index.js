require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");   // ← ADD THIS LINE

const app = express();
app.use(cors());                // ← ADD THIS LINE
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// basic test route
app.get("/", (req, res) => {
  res.send("HVAC AI is running");
});

// AI route
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert HVAC technician. Diagnose problems clearly and give practical solutions.",
        },
        {
          role: "user",
          content: question,
        },
      ],
    });

    res.json({
      answer: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error talking to AI");
  }
});
app.post("/call", (req, res) => {
  res.type("text/xml");
  res.send(`
    <Response>
      <Say>Connecting you now</Say>
    </Response>
  `);
});
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
