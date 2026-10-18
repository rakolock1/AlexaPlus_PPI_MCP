# Alexa+ PPI --- Procedure Follow-Up Instructions

A hackathon demonstration of a conversational interface for retrieving
and presenting post-operative procedure follow-up instructions using an
MCP (Model Context Protocol) server and an Amazon Aurora MySQL database.

## Project Overview

Procedure Follow-Up Instructions (PPI) helps patients access
instructions following a medical procedure. This project demonstrates
how a conversational interface can retrieve relevant instructions from a
database, display them in a browser, and read them aloud.

The demo explores how conversational AI can make post-operative
instructions easier for patients to access and understand.

## Architecture

The project has two local Node.js servers and an Aurora MySQL database.

-   **MCP server (`server.js`):** Runs on port 3000 and provides tools
    for retrieving patient context and post-operative instructions.
-   **Browser demo server (`demo-server.js`):** Runs on port 3001 and
    serves the browser-based demonstration.
-   **Database access (`db.js`):** Connects to the Aurora MySQL
    database.

The browser demo uses the local MCP endpoint at
`http://127.0.0.1:3000/mcp`.

``` text
Browser Demo
    |
    v
demo-server.js — Port 3001
    |
    v
MCP Server — server.js — Port 3000
    |
    v
db.js
    |
    v
Amazon Aurora MySQL
```

Run the MCP server and browser demo server in separate PowerShell
windows.

## Demonstrated Features

The browser demo supports microphone input, displays retrieved
instructions, and speaks responses aloud.

The following topics have been tested successfully:

-   **Today's Instructions** --- Retrieves instructions applicable to
    the current post-operative day.
-   **Bathing Instructions** --- Retrieves bathing-related instructions.
-   **What To Expect** --- Retrieves relevant post-operative guidance.
-   **Activity Instructions** --- Retrieves activity guidance, including
    the post-operative day and stored activity instructions.

## MCP Tools

The MCP server exposes these tools:

  -----------------------------------------------------------------------
  Tool                                Purpose
  ----------------------------------- -----------------------------------
  `get_patient_context`               Retrieves relevant patient and
                                      procedure context.

  `get_today_instructions`            Retrieves instructions applicable
                                      to the current post-operative day.

  `get_instruction_component`         Retrieves a specified instruction
                                      component, such as bathing or
                                      activity.
  -----------------------------------------------------------------------

The server retrieves data from the database for the calling application
to present.

## Technology Stack

-   Node.js and JavaScript
-   Model Context Protocol (MCP)
-   Amazon Aurora MySQL
-   `mysql2` for database connectivity
-   `dotenv` for environment-based configuration
-   Browser-based demonstration with microphone input and spoken
    responses

## Prerequisites

Before running the demo, you need:

-   Node.js and npm
-   Git
-   Access to an Aurora MySQL database containing the required PPI data
-   Valid database connection settings and a demo patient identifier

## Configuration

The project uses environment variables to keep configuration separate
from source code.

The local `.env` file must define these variables:

  Variable         Purpose
  ---------------- ---------------------------------
  `DB_HOST`        Aurora MySQL database host
  `DB_USER`        Database username
  `DB_PASSWORD`    Database password
  `DB_NAME`        Database name
  `DEMO_USER_ID`   Identifier for the demo patient

### Setup

1.  Clone or download this repository.

2.  Open PowerShell in the project directory.

3.  Install the dependencies:

    ``` powershell
    npm install
    ```

4.  Create a local `.env` file using `.env.example` as a template.
    Replace the example values with your own authorized configuration.

5.  Keep `.env` on your local computer. Do not commit or upload it to
    GitHub.

The `.env.example` file contains placeholders only. The actual `.env`
file is excluded by `.gitignore`.

## Running the Demo

### Terminal 1 --- Start the MCP server

From the project directory, run:

``` powershell
node server.js
```

Leave this PowerShell window open while testing.

### Terminal 2 --- Start the browser demo

Open a second PowerShell window, navigate to the same project directory,
and run:

``` powershell
node demo-server.js
```

Leave this window open as well.

### Open the browser

Navigate to <http://127.0.0.1:3001>.

Allow microphone access if prompted, then try one of the demonstrated
instruction topics.

The browser demo depends on the MCP server remaining active on port 3000
and on the database being accessible.

## Security and Privacy

-   Never commit `.env` or expose database credentials.
-   Do not include actual patient identifiers or protected health
    information in source code, documentation, screenshots, or test
    output.
-   Use authorized demo data when testing.
-   Keep `.env` excluded from version control.
-   Review changes before committing or pushing them to GitHub.

## Project Status

The initial project files and this documentation are maintained in
GitHub. The browser demo has been tested for the four instruction topics
listed above.

This repository documents a local demonstration workflow. Connecting a
remotely hosted MCP endpoint to Alexa+ requires the appropriate hosting,
access, and integration configuration. The local browser demo alone does
not establish that a complete Alexa+ integration is operational.

## Disclaimer

This is a hackathon demonstration, not a production clinical
application. It is not a substitute for instructions from a qualified
healthcare professional. Before real-world clinical use, the system
would require appropriate clinical validation, privacy and security
safeguards, access controls, and operational review.

## Repository

[AlexaPlus_PPI_MCP on
GitHub](https://github.com/rakolock1/AlexaPlus_PPI_MCP)

## Hackathon Friction Log

During development, I documented practical issues encountered
while setting up and testing the MCP server and development
environment, along with workarounds and suggested improvements.

See the [Friction Log](FRICTION_LOG.md).
