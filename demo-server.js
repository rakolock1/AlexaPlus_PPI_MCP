require("dotenv").config();

const express = require("express");

const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StreamableHTTPClientTransport } =
  require("@modelcontextprotocol/sdk/client/streamableHttp.js");

const app = express();
const port = 3001;

app.use(express.json());

// This is the demo patient's internal test ID.
// It stays on the server and is never sent to the browser.
const DEMO_USER_ID = process.env.DEMO_USER_ID;

// Call the MCP server
async function getTodayInstructions() {
  const transport = new StreamableHTTPClientTransport(
    new URL("http://127.0.0.1:3000/mcp")
  );

  const client = new Client({
    name: "PPI Alexa+ Demo",
    version: "1.0.0"
  });

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: "get_today_instructions",
      arguments: {
        user_id: DEMO_USER_ID
      }
    });

    return result;
  } finally {
    await client.close();
  }
}

// Browser asks for today's instructions
app.get("/api/today", async (req, res) => {
  try {
    const result = await getTodayInstructions();

    // The MCP tool returns its useful data as JSON text.
    const data = JSON.parse(result.content[0].text);

    res.json(data);

  } catch (error) {
    console.error("Demo MCP error:", error);

    res.status(500).json({
      error: "Unable to retrieve today's instructions."
    });
  }
});

// Browser asks for instructions for a specific component
app.get("/api/component/:id", async (req, res) => {
  const componentId = Number(req.params.id);

  if (!Number.isInteger(componentId) || componentId < 1) {
    return res.status(400).json({
      error: "Invalid component ID."
    });
  }

  const transport = new StreamableHTTPClientTransport(
    new URL("http://127.0.0.1:3000/mcp")
  );

  const client = new Client({
    name: "PPI Alexa+ Demo",
    version: "1.0.0"
  });

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: "get_instruction_component",
      arguments: {
        user_id: DEMO_USER_ID,
        component_id: componentId
      }
    });

    const data = JSON.parse(result.content[0].text);

    res.json(data);

  } catch (error) {
    console.error("Demo MCP component error:", error);

    res.status(500).json({
      error: "Unable to retrieve component instructions."
    });

  } finally {
    await client.close();
  }
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Procedure Followup Instructions</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f7fa;
        }

        .card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h1 {
          margin-top: 0;
        }

        button {
          padding: 14px 20px;
          margin: 10px 10px 10px 0;
          font-size: 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }

        #status {
          margin-top: 20px;
          padding: 15px;
          background: #f0f2f5;
          border-radius: 8px;
        }

        .instruction {
          margin: 12px 0;
          padding: 12px;
          border-left: 4px solid #666;
          background: #f8f8f8;
        }

        .category {
          margin-top: 25px;
        }

        .category h3 {
          margin-bottom: 8px;
        }
      </style>
    </head>

    <body>
      <div class="card">

        <h1>Procedure Followup Instructions</h1>

        <p><strong>Demo Patient:</strong> Phil</p>

        <p>What would you like to know?</p>

<button onclick="startListening()">
  🎤 Ask a question
</button>

<p id="heard"></p>

        <button onclick="getTodayInstructions()">
          What do I need to do today?
        </button>

       <button onclick="getExpectInstructions()">
  What should I expect?
</button>

        <button onclick="getBathingInstructions()">
  What about bathing?
</button>

        <div id="status">
          Demo interface is ready.
        </div>

      </div>

      <script>

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

let recognition;

if (SpeechRecognition) {

  recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = function() {
    document.getElementById("heard").innerHTML =
      "🎤 Listening...";
  };

  recognition.onresult = function(event) {

    const transcript =
      event.results[0][0].transcript;

    document.getElementById("heard").innerHTML =
      "You said: <strong>" + transcript + "</strong>";

    processVoiceQuestion(transcript);
  };

  recognition.onerror = function(event) {

    document.getElementById("heard").innerHTML =
      "Sorry, I couldn't hear you. Please try again.";

    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = function() {
    console.log("Speech recognition ended.");
  };

} else {

  document.getElementById("heard").innerHTML =
    "Voice recognition is not supported by this browser.";
}

function speakResponse(text) {

  if (!("speechSynthesis" in window)) {
    console.log("Speech synthesis is not supported.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

function startListening() {

  if (!recognition) {
    return;
  }

  recognition.start();
}




function processVoiceQuestion(question) {

  const lowerQuestion = question.toLowerCase().trim();

  // Questions about bathing or showering.
  if (
    lowerQuestion.includes("bathing") ||
    lowerQuestion.includes("bath") ||
    lowerQuestion.includes("shower") ||
    lowerQuestion.includes("wash up")
  ) {

    getBathingInstructions();

  // Questions about activities and physical restrictions.
  } else if (
    lowerQuestion.includes("activity") ||
    lowerQuestion.includes("activities") ||
    lowerQuestion.includes("exercise") ||
    lowerQuestion.includes("walking") ||
    lowerQuestion.includes("walk") ||
    lowerQuestion.includes("lifting") ||
    lowerQuestion.includes("driving") ||
    lowerQuestion.includes("drive") ||
    lowerQuestion.includes("restriction")
  ) {

    getActivityInstructions();

  // Questions about recovery and what to expect.
  } else if (
    lowerQuestion.includes("expect") ||
    lowerQuestion.includes("normal") ||
    lowerQuestion.includes("recovery") ||
    lowerQuestion.includes("recover")
  ) {

    getExpectInstructions();

  // Questions about today's instructions.
  } else if (
    lowerQuestion.includes("today") ||
    lowerQuestion.includes("instruction") ||
    lowerQuestion.includes("what should i do") ||
    lowerQuestion.includes("what do i need to do")
  ) {

    getTodayInstructions();

  } else {

    document.getElementById("status").innerHTML =
      "I heard: <strong>" +
      question +
      "</strong><br><br>" +
      "I can help with today's instructions, bathing, activities, " +
      "or what to expect. Please ask me about one of those topics.";

  }
}
async function getActivityInstructions() {

  const status = document.getElementById("status");

  status.innerHTML = "Checking your activity instructions...";

  try {

    const response = await fetch("/api/component/1");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    if (!data.registered) {
      status.innerHTML =
        "This demo patient is not registered.";
      return;
    }

    let html = "";

    html += "<h2>Activity Instructions</h2>";

    html +=
      "<p>You are postoperative day " +
      data.postoperative_day +
      ".</p>";

    let spokenText =
      "You are postoperative day " +
      data.postoperative_day +
      ". Here is your activity guidance. ";

    if (!data.instructions || data.instructions.length === 0) {

      html +=
        "<p>No activity instructions were found for today.</p>";

      spokenText =
        "I couldn't find any activity instructions for today. " +
        "Please check with your care team.";

    } else {

      for (const instruction of data.instructions) {

        html +=
          '<div class="instruction">' +
          instruction.instruction +
          "</div>";

        spokenText += instruction.instruction + " ";
      }
    }

    status.innerHTML = html;

    speakResponse(spokenText);

  } catch (error) {

    console.error(error);

    status.innerHTML =
      "Unable to retrieve your activity instructions.";
  }
}
async function getTodayInstructions() {

  const status = document.getElementById("status");

  status.innerHTML = "Checking your instructions...";
console.log("getTodayInstructions STARTED");

  try {

    const response = await fetch("/api/today");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    if (!data.registered) {
      status.innerHTML = "This demo patient is not registered.";
      return;
    }

    let html = "";

    html +=
      "<h2>Today's Instructions</h2>";

    html +=
      "<p>You are postoperative day " +
      data.postoperative_day +
      ".</p>";

    let currentCategory = "";

    for (const instruction of data.instructions) {

      if (instruction.comp_name !== currentCategory) {

        currentCategory = instruction.comp_name;

        html +=
          '<div class="category"><h3>' +
          currentCategory +
          "</h3></div>";
      }

      html +=
        '<div class="instruction">' +
        instruction.instruction +
        "</div>";
    }

    status.innerHTML = html;

    // Build the response that Alexa-style voice output will speak.
    let spokenText =
      "You are postoperative day " +
      data.postoperative_day +
      ". Here are your instructions for today. ";

    for (const instruction of data.instructions) {

      spokenText +=
        instruction.comp_name +
        ". " +
        instruction.instruction +
        " ";
    }

    // Speak the instructions aloud.
console.log("ABOUT TO SPEAK:", spokenText);
    speakResponse(spokenText);

  } catch (error) {

    console.error(error);

    status.innerHTML =
      "Unable to retrieve your instructions.";
  }
}

async function getBathingInstructions() {

  const status = document.getElementById("status");

  status.innerHTML = "Checking your bathing instructions...";

  try {

    const response = await fetch("/api/component/2");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    if (!data.registered) {
      status.innerHTML =
        "This demo patient is not registered.";
      return;
    }

    let html = "";

    html += "<h2>Bathing Instructions</h2>";

    html +=
      "<p>You are postoperative day " +
      data.postoperative_day +
      ".</p>";

    for (const instruction of data.instructions) {

      html +=
        '<div class="instruction">' +
        instruction.instruction +
        "</div>";
    }

    status.innerHTML = html;

    // Prepare the spoken response.
    let spokenText =
      "You are postoperative day " +
      data.postoperative_day +
      ". Here are your bathing instructions. ";

    for (const instruction of data.instructions) {
      spokenText += instruction.instruction + " ";
    }

    // Speak the bathing instructions aloud.
    speakResponse(spokenText);

  } catch (error) {

    console.error(error);

    status.innerHTML =
      "Unable to retrieve your bathing instructions.";
  }
}


async function getExpectInstructions() {

  const status = document.getElementById("status");

  status.innerHTML = "Checking what to expect...";

  try {

    const response = await fetch("/api/component/9");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    if (!data.registered) {
      status.innerHTML =
        "This demo patient is not registered.";
      return;
    }

    let html = "";

    html += "<h2>What To Expect</h2>";

    html +=
      "<p>You are postoperative day " +
      data.postoperative_day +
      ".</p>";

    for (const instruction of data.instructions) {

      html +=
        '<div class="instruction">' +
        instruction.instruction +
        "</div>";
    }

    status.innerHTML = html;

    let spokenText =
      "You are postoperative day " +
      data.postoperative_day +
      ". Here is what to expect. ";

    for (const instruction of data.instructions) {
      spokenText += instruction.instruction + " ";
    }

    speakResponse(spokenText);

  } catch (error) {

    console.error(error);

    status.innerHTML =
      "Unable to retrieve your what to expect instructions.";
  }
}
      </script>

    </body>
    </html>
  `);
});

app.listen(port, "127.0.0.1", () => {
  console.log(
    `Alexa+ demo interface running at http://127.0.0.1:${port}`
  );
});