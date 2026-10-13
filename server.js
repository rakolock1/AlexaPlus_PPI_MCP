require("dotenv").config();

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const express = require("express");
const { StreamableHTTPServerTransport } =
  require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");
const pool = require("./db");

// Create a new MCP server instance
function createServer() {
  const server = new McpServer({
    name: "Procedure Followup Instructions",
    version: "1.0.0"
  });
// Test tool
server.tool(
  "get_server_status",
  "Confirm that the Procedure Followup Instructions MCP server is running.",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: "Procedure Followup Instructions MCP server is running."
        }
      ]
    };
  }
);

// Get patient/procedure context
server.tool(
  "get_patient_context",
  "Retrieve the patient's registered procedure, variation, procedure date, and physician.",
 {
  user_id: z.string().describe("The patient's registered user ID.")
},
  async ({ user_id }) => {
    try {
      const sql = `
        SELECT
          ppi.first_name,
          ppi.proc_code,
          ppi.variation_num,
          ppi.doc_code,
          ppi.proc_date,
          p.procedure_name,
          ph.doc_first_name,
          ph.doc_last_name
        FROM PPIUsers ppi
        LEFT JOIN Procedures p
          ON p.proc_id = ppi.proc_code
        LEFT JOIN Physicians ph
          ON ph.id = ppi.doc_code
        WHERE ppi.user_id = ?
        LIMIT 1
      `;

      const [rows] = await pool.query(sql, [user_id]);

      if (rows.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                registered: false
              })
            }
          ]
        };
      }

      const patient = rows[0];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              registered: true,
              first_name: patient.first_name,
              procedure_code: patient.proc_code,
              variation_num: patient.variation_num,
              physician_code: patient.doc_code,
              procedure_date: patient.proc_date,
              procedure_name: patient.procedure_name,
              physician_first_name: patient.doc_first_name,
              physician_last_name: patient.doc_last_name
            })
          }
        ]
      };

    } catch (error) {
      console.error("get_patient_context error:", error);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Unable to retrieve patient context."
            })
          }
        ],
        isError: true
      };
    }
  }
);

// Get today's applicable postoperative instructions
server.tool(
  "get_today_instructions",
  "Retrieve all postoperative instructions applicable to the patient's current postoperative day.",
  {
    user_id: z.string().describe("The patient's registered user ID.")
  },
  async ({ user_id }) => {
    try {
      // First retrieve the patient's procedure registration
      const [patientRows] = await pool.query(
        `
        SELECT
          ppi.proc_code,
          ppi.variation_num,
          ppi.proc_date
        FROM PPIUsers ppi
        WHERE ppi.user_id = ?
        LIMIT 1
        `,
        [user_id]
      );

      if (patientRows.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                registered: false,
                instructions: []
              })
            }
          ]
        };
      }

      const patient = patientRows[0];

      // Calculate the current postoperative day using calendar dates
      const [instructionRows] = await pool.query(
        `
        SELECT
          i.inst_id,
          i.inst_comp_id,
          c.comp_name,
          i.instruction,
          i.start_day_num,
          i.end_day_num
        FROM Instructions i
        LEFT JOIN InstructComponents c
          ON c.inst_comp_id = i.inst_comp_id
        WHERE i.proc_id = ?
          AND i.variation_num = ?
          AND DATEDIFF(
                CURDATE(),
                DATE(?)
              ) >= i.start_day_num
          AND (
                i.end_day_num IS NULL
                OR DATEDIFF(
                     CURDATE(),
                     DATE(?)
                   ) <= i.end_day_num
              )
        ORDER BY
          i.inst_comp_id,
          i.start_day_num,
          i.inst_id
        `,
        [
          patient.proc_code,
          patient.variation_num,
          patient.proc_date,
          patient.proc_date
        ]
      );

      // Calculate postoperative day for the response
      const [dayRows] = await pool.query(
        `
        SELECT DATEDIFF(CURDATE(), DATE(?)) AS postoperative_day
        `,
        [patient.proc_date]
      );

      const postoperativeDay = dayRows[0].postoperative_day;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              registered: true,
              postoperative_day: postoperativeDay,
              procedure_code: patient.proc_code,
              variation_num: patient.variation_num,
              procedure_date: patient.proc_date,
              instructions: instructionRows
            })
          }
        ]
      };

    } catch (error) {
      console.error("get_today_instructions error:", error);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Unable to retrieve today's instructions."
            })
          }
        ],
        isError: true
      };
    }
  }
);
// Get instructions for a specific component
server.tool(
  "get_instruction_component",
  "Retrieve the postoperative instructions for a specific instruction component.",
  {
    user_id: z.string().describe("The patient's registered user ID."),
    component_id: z.number().int().min(1).describe("The instruction component ID.")
  },
  async ({ user_id, component_id }) => {
    try {
      // Retrieve the patient's procedure registration
      const [patientRows] = await pool.query(
        `
        SELECT
          ppi.proc_code,
          ppi.variation_num,
          ppi.proc_date
        FROM PPIUsers ppi
        WHERE ppi.user_id = ?
        LIMIT 1
        `,
        [user_id]
      );

      if (patientRows.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                registered: false,
                instructions: []
              })
            }
          ]
        };
      }

      const patient = patientRows[0];

      // Retrieve instructions for the requested component
      // that apply to the patient's current postoperative day.
      const [instructionRows] = await pool.query(
        `
        SELECT
          i.inst_id,
          i.inst_comp_id,
          c.comp_name,
          i.instruction,
          i.start_day_num,
          i.end_day_num
        FROM Instructions i
        LEFT JOIN InstructComponents c
          ON c.inst_comp_id = i.inst_comp_id
        WHERE i.proc_id = ?
          AND i.variation_num = ?
          AND i.inst_comp_id = ?
          AND DATEDIFF(
                CURDATE(),
                DATE(?)
              ) >= i.start_day_num
          AND (
                i.end_day_num IS NULL
                OR DATEDIFF(
                     CURDATE(),
                     DATE(?)
                   ) <= i.end_day_num
              )
        ORDER BY
          i.start_day_num,
          i.inst_id
        `,
        [
          patient.proc_code,
          patient.variation_num,
          component_id,
          patient.proc_date,
          patient.proc_date
        ]
      );

      const [dayRows] = await pool.query(
        `
        SELECT DATEDIFF(CURDATE(), DATE(?)) AS postoperative_day
        `,
        [patient.proc_date]
      );

      const postoperativeDay = dayRows[0].postoperative_day;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              registered: true,
              postoperative_day: postoperativeDay,
              procedure_code: patient.proc_code,
              variation_num: patient.variation_num,
              component_id: component_id,
              instructions: instructionRows
            })
          }
        ]
      };

    } catch (error) {
      console.error("get_instruction_component error:", error);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Unable to retrieve component instructions."
            })
          }
        ],
        isError: true
      };
    }
  }
);
  return server;
}
// Start the MCP server using Streamable HTTP
async function main() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

 app.post("/mcp", async (req, res) => {
  try {
    const server = createServer();

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    } catch (error) {
      console.error("MCP HTTP error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error"
          },
          id: null
        });
      }
    }
  });

  app.listen(port, "127.0.0.1", () => {
    console.log(
      `Procedure Followup Instructions MCP server running at http://127.0.0.1:${port}/mcp`
    );
  });
}

main().catch((error) => {
  console.error("MCP server error:", error);
  process.exit(1);
});