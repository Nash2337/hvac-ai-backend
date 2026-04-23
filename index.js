require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Health check (so Render doesn't crash)
app.get("/", (req, res) => {
  res.send("HVAC AI backend running");
});

// ✅ Twilio → VAPI route
app.post("/inbound_call", async (req, res) => {
  try {
    const caller = req.body.Caller || "unknown";

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
    console.error("ERROR:", error.response?.data || error.message);
    res.status(500).send("Error handling call");
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
   