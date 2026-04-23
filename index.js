require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.send("HVAC AI backend running");
});

/**
 * TWILIO → VAPI HANDOFF
 */
app.post("/inbound_call", async (req, res) => {
  try {
    const caller = req.body.Caller || "unknown";

    console.log("Incoming call from:", caller);

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

/**
 * VAPI → EMAIL LEAD WEBHOOK
 */
app.post("/vapi-webhook", async (req, res) => {
  try {
    const message = req.body.message || req.body;
    const type = message.type || "unknown";

    console.log("Webhook received:", type);

    // Only trigger on end of call
    if (type !== "end-of-call-report") {
      return res.status(200).send("Ignored");
    }

    const call = message.call || {};
    const summary = message.summary || "No summary provided.";
    const transcript = message.transcript || "No transcript provided.";
    const caller = call.customer?.number || "Unknown caller";

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
    console.error("EMAIL ERROR:", error);
    res.status(500).send("Webhook failed");
  }
});

/**
 * START SERVER
 */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
   