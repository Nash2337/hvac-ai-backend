const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**
 * HEALTH CHECK (optional)
 */
app.get("/", (req, res) => {
  res.send("Server is live");
});

/**
 * INBOUND CALL FROM TWILIO
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
 * SERVER START
 */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
   