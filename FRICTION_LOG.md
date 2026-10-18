# Friction Log — Procedure Followup Instructions (Alexa+ Hackathon)

This log records specific development friction encountered while building and testing the Procedure Followup Instructions demo for the Build, Ship, Shape: Amazon Developer Hackathon.

These entries describe the development experience, not failures of the patient-instruction demo itself. No patient identifiers, credentials, or other confidential data are included.

## Entry 1 — Browser demo could not reach the MCP server

**Task attempted**  
Run the browser demo and retrieve post-operative instructions through the local MCP server.

**Steps taken**  
Start the browser demo and use a demo interaction that requests information from the MCP endpoint at `http://127.0.0.1:3000/mcp`.

**Expected result**  
The browser demo retrieves the requested instructions, displays them, and speaks the response.

**Actual result**  
The demo logged a `fetch failed` error with `ECONNREFUSED 127.0.0.1:3000` when the MCP server was not running or was unavailable.

**Severity**  
Medium — local testing was blocked until the backend was available.

**Workaround**  
Start `node server.js` in one PowerShell window and leave it running. Start `node demo-server.js` in a second PowerShell window, then open `http://127.0.0.1:3001`.

**Actionable suggestion**  
Provide a startup script or preflight check that tests the MCP endpoint before launching the browser demo and gives a clear message if the required service is unavailable. A concise explanation of the startup order would also help developers avoid this error.

## Entry 2 — Editing PHP through the Lightsail browser terminal was unfamiliar

**Task attempted**  
Make a small, targeted edit to a PHP page on an Ubuntu Lightsail instance using the browser-based terminal and Nano.

**Steps taken**  
Open the PHP file, locate a heading or short text block, replace it, save the file, and verify the result.

**Expected result**  
Complete the edit without confusion about whether input is going to the Linux shell, Nano's editor, or Nano's search/replace/save prompts.

**Actual result**  
The shell prompts and Nano's search, replace, and save prompts were different from the interaction patterns I was used to. It was sometimes unclear which prompt was active. Text entered in the wrong context produced command errors and extra troubleshooting steps.

**Severity**  
Medium — the task was completed, but the unfamiliar interaction model increased the time required and made small edits harder than expected.

**Workaround**  
Proceed one step at a time, confirm that Nano is visibly open before editing, use short commands at the shell prompt, and verify each saved change separately.

**Actionable suggestion**  
Make the current interaction mode more obvious in the browser terminal and provide concise beginner guidance for switching between the shell, text editor, search/replace prompts, and save prompts. A guided edit workflow for a small file change would reduce mistakes.

## Entry 3 — Selecting long text in the browser terminal was difficult

**Task attempted**  
Select and copy a long block of terminal output or code that extended beyond the visible terminal window.

**Steps taken**  
Drag to select the text, scrolling as needed to reach the beginning or end of the desired block.

**Expected result**  
Select the complete block accurately and copy it in one operation.

**Actual result**  
Selecting long blocks while scrolling was not intuitive; keeping a selection active while moving through text required a workaround.

**Severity**  
Low to Medium — copying output was possible, but the interaction was inefficient and easy to get wrong.

**Workaround**  
Use the scrollbar control on the right side of the terminal, keeping the cursor on it while scrolling up or down to extend the selection.

**Actionable suggestion**  
Support reliable auto-scrolling while selecting text near the visible edges, and document a clear method for copying multi-screen output from the browser terminal.

---

## Scope note

The issues above were encountered while using the AWS Lightsail browser terminal to work on a small web application and while starting two dependent local Node.js services. The log focuses on concrete tasks, expected and actual results, severity, workarounds, and actionable improvements.
