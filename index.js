require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Resend } = require("resend");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const resend = new Resend(process.env.RESEND_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("HVAC AI backend running");
});

app.post("/inbound_call", async (req, res) => {
  try {
    const caller = req.body.Caller || "unknown";

    const response = await axios.post(
      "https://api.vapi.ai/call",
      {
        phoneNumberId: process.env.PHONE_NUMBER_ID,
        assistantId: process.env.ASSISTANT_ID,
        phoneCallProviderBypassEnabled: true,
        customer: {
          number: caller,
        },
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
    console.error("VAPI ERROR:", error.response?.data || error.message);
    res.status(500).send("Error handling call");
  }
});

app.post("/vapi-webhook", async (req, res) => {
  try {
    const message = req.body.message || req.body;
    const type = message.type || "unknown";

    console.log("Webhook received:", type);

    if (type !== "end-of-call-report") {
      return res.status(200).send("Ignored");
    }

    const call = message.call || {};
    const transcript = message.transcript || "No transcript provided.";
    const caller = call.customer?.number || "Unknown caller";

    let summary = "No summary provided.";

    try {
      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Extract key HVAC lead info from this call. Return only this format:\nName:\nPhone:\nAddress:\nIssue:\nUrgency:\nNext Step:",
          },
          {
            role: "user",
            content: transcript,
          },
        ],
      });

      summary = ai.choices[0].message.content;
    } catch (err) {
      console.error("SUMMARY ERROR:", err.response?.data || err.message);
    }

    await resend.emails.send({
      from: "HVAC AI <onboarding@resend.dev>",
      to: process.env.LEAD_EMAIL,
      subject: "🔥 New HVAC AI Lead",
      text: `
New HVAC Lead

Caller: ${caller}
Time: ${new Date().toLocaleString()}

Summary:
${summary}

Transcript:
${transcript}
      `,
    });

    console.log("Lead email sent");

    res.status(200).send("Lead emailed");
  } catch (error) {
    console.error("EMAIL ERROR:", error.response?.data || error.message);
    res.status(500).send("Webhook failed");
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});