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
const axios = require("axios");
app.post("/inbound_call", async (req, res) => {
  try {
    res.type("text/xml");

    res.send(`
      <Response>
        <Say>Connecting you now</Say>
      </Response>
    `);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error handling call");
  }
});
  try {
    const caller = req.body.Caller;

    const response = await axios.post(
      "https://api.vapi.ai/call",
      {
        phoneCallProviderBypassEnabled: true,
        customer: {
          number: caller,
        },
        assistantId: process.env.ASSISTANT_ID,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PRIVATE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const twiml = response.data.phoneCallProviderDetails.twiml;

    res.type("text/xml");
    res.send(twiml);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error handling call");
  }
});
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
