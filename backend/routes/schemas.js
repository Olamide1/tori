const express = require("express");
const router = express.Router();
const multer = require("multer");
const sqlFormatter = require("sql-formatter"); // For SQL formatting
const { Parser } = require("node-sql-parser");
const Schema = require("../models/Schema");
const Subscriber = require("../models/Subscriber")
const { verifyToken, validateQuerySafety } = require("../middlewares/authMiddleware");
const { OpenAI } = require("openai");
const { parse } = require("csv-parse/lib/sync");


const upload = multer({ storage: multer.memoryStorage() });


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const preprocessSQL = (sqlContent) => {
  return sqlContent
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line commentscle
    .replace(/--.*$/gm, "") // Remove single-line comments
    .replace(/;\s*$/, "") // Remove trailing semicolons
    .replace(/INSERT INTO[\s\S]*?;/gi, "") // Remove all INSERT INTO statements
    .split(/;\s*(?=CREATE TABLE)/i) // Split by CREATE TABLE
    .map(statement => statement.trim()) // Clean up extra spaces
    .filter(statement => statement.toLowerCase().startsWith("create table")); // Keep only CREATE TABLE
};



const parseSQLFile = (sqlContent, databaseType = "mysql") => {
  const parser = new Parser();
  const parsedColumns = [];
  const columnSet = new Set();

  const statements = preprocessSQL(sqlContent);

  statements.forEach((statement, index) => {
    try {
      const ast = parser.astify(statement, { database: databaseType });

      if (ast.type === "create" && ast.create_definitions) {
        const tableName = ast.table?.[0]?.table || `Unknown_Table_${index}`;

        ast.create_definitions
          .filter((def) => def.resource === "column")
          .forEach((def) => {
            const columnName = def.column?.column;
            const dataType = def.definition?.dataType || "UNKNOWN";
            const description =
              typeof def.comment === "object"
                ? def.comment?.value?.value || JSON.stringify(def.comment)
                : def.comment || `Column from table ${tableName}`;

            if (columnName && !columnSet.has(`${tableName}_${columnName}`)) {
              columnSet.add(`${tableName}_${columnName}`);
              parsedColumns.push({
                name: columnName,
                dataType,
                description: description.toString(), // Ensure it's a string
              });
            }
          });
      }
    } catch (error) {
      console.error("Parsing error:", { statement, error: error.message });
    }
  });

  return parsedColumns.length > 0 ? parsedColumns : extractColumnsFallback(sqlContent, columnSet);
};




const extractColumnsFallback = (sqlContent, columnSet) => {
  const columnRegex = /^\s*(\w+)\s+(\w+)(\(\d+(\s*,\s*\d+)?\))?/gim;
  const ignorePatterns = /(PRIMARY KEY|UNIQUE KEY|CONSTRAINT|INDEX|FOREIGN KEY|KEY)/i;
  const columns = [];
  let match;

  while ((match = columnRegex.exec(sqlContent)) !== null) {
    const columnName = match[1];
    const dataType = match[2] + (match[3] || "");

    if (!ignorePatterns.test(columnName) && !ignorePatterns.test(dataType)) {
      const uniqueKey = `Fallback_${columnName}`;
      if (!columnSet.has(uniqueKey)) {
        columnSet.add(uniqueKey);
        columns.push({
          name: columnName,
          dataType,
          description: "Parsed via fallback method", // String description
        });
      }
    }
  }

  return columns;
};




router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const { name, databaseType = "mysql" } = req.body;

    if (!name || !req.file) {
      return res.status(400).json({ message: "Schema name and file are required." });
    }

    const fileContent = req.file.buffer.toString("utf-8");
    let parsedColumns = [];

    // Check file type and parse accordingly
    if (req.file.mimetype === "text/csv") {
      // Parse CSV
      const rows = csv(fileContent, {
        columns: true, // Use first row as column names
        skip_empty_lines: true,
      });

      parsedColumns = rows.map((row) => ({
        name: row["Column Name"]?.trim(),
        dataType: row["Data Type"]?.trim(),
        description: row["Description"]?.trim() || "No description",
      })).filter((col) => col.name && col.dataType); // Filter out invalid rows
    } else if (req.file.mimetype === "application/sql" || req.file.originalname.endsWith(".sql")) {
      // Parse SQL
      parsedColumns = parseSQLFile(fileContent, databaseType);
    } else {
      return res.status(400).json({ message: "Unsupported file type. Upload .sql or .csv files." });
    }

    if (parsedColumns.length === 0) {
      return res.status(400).json({
        message: "No valid columns found in the file.",
        details: "Ensure the file has valid column definitions.",
      });
    }

    const newSchema = new Schema({
      name,
      columns: parsedColumns,
      uploadedBy: req.user.id,
    });

    await newSchema.save();
    res.status(201).json({
      message: "Schema uploaded successfully",
      schema: newSchema,
      parsedColumns,
    });
  } catch (error) {
    console.error("Error processing schema file:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Server error during schema processing.",
      error: error.message,
    });
  }
});



// GET: Fetch Schema Metadata for Autosuggest
router.get("/:id/metadata", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const schema = await Schema.findById(id);
    if (!schema) {
      return res.status(404).json({ message: "Schema not found." });
    }

    if (schema.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // Prepare metadata for autosuggest
    const metadata = schema.columns.map((column) => ({
      tableName: schema.name,
      columnName: column.name,
    }));

    res.status(200).json({ metadata });
  } catch (error) {
    console.error("Error fetching metadata:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



// GET: Fetch All Schemas
router.get("/", verifyToken, async (req, res) => {
  try {
    const schemas = await Schema.find({ uploadedBy: req.user.id });
    res.status(200).json(schemas);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE: Delete a Schema
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const schema = await Schema.findById(id);
    if (!schema) {
      return res.status(404).json({ message: "Schema not found" });
    }

    if (schema.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Schema.findByIdAndDelete(id);
    res.status(200).json({ message: "Schema deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT: Update a Schema
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, columns } = req.body;

    if (!name || !columns || !Array.isArray(columns)) {
      return res.status(400).json({ message: "Invalid schema data" });
    }

    if (columns.length > 100) {
      return res.status(400).json({ message: "Schema exceeds the maximum allowed columns (100)." });
    }

    const schema = await Schema.findById(id);
    if (!schema) {
      return res.status(404).json({ message: "Schema not found" });
    }

    if (schema.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    schema.name = name;
    schema.columns = columns;

    await schema.save();
    res.status(200).json({ message: "Schema updated successfully", schema });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET: Fetch a Single Schema by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const schema = await Schema.findById(id);
    if (!schema) {
      return res.status(404).json({ message: "Schema not found" });
    }

    if (schema.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(schema);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST: Generate AI SQL Query
router.post("/:id/generate-query", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt, databaseType } = req.body;

    // Input validation
    if (!prompt || !databaseType) {
      return res.status(400).json({ message: "Prompt and database type are required." });
    }
    if (prompt.length > 4000) {
      return res.status(400).json({ message: "Prompt exceeds maximum allowed length (4000 characters)." });
    }

    // Fetch schema by ID
    const schema = await Schema.findById(id);
    if (!schema) {
      return res.status(404).json({ message: "Schema not found." });
    }
    if (schema.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access to schema." });
    }

    // Trial check
    const subscriber = await Subscriber.findOne({ email: req.user.email });
    if (subscriber.plan === "Trial") {
      if (subscriber.remainingQueries <= 0) {
        return res.status(403).send({ message: "Trial expired. Upgrade to Pro." });
      }
      subscriber.remainingQueries -= 1;
      await subscriber.save();
    }

    // Prepare schema description
    const schemaDescription = schema.columns
      .map((col) => `${col.name} (${col.dataType}): ${col.description || "No description"}`)
      .join(", ");

    // Construct the OpenAI prompt with explicit structure for the response
    const fullPrompt = `
      You are an expert SQL generator. 
      Given the following schema: ${schemaDescription}, 
      and the user query: "${prompt}", 
      generate a SQL query that matches the user's intent.
      
      Always return the response in the following JSON structure:
      {
        "generatedQuery": "<SQL query>"
      }
    `;

    // Call OpenAI API
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Generate SQL queries in JSON format only." },
        { role: "user", content: fullPrompt },
      ],
      max_tokens: 300,
    });

    // Parse OpenAI response
    const aiContent = aiResponse.choices[0].message.content.trim();
    if (!aiContent) {
      console.error("Unexpected OpenAI response structure:", JSON.stringify(aiResponse, null, 2));
      return res.status(500).json({ message: "Failed to generate query. Invalid AI response." });
    }

    // Parse JSON from the response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiContent);
    } catch (parseError) {
      console.error("Error parsing AI response as JSON:", aiContent);
      return res.status(500).json({ message: "Failed to parse AI response as JSON." });
    }

    if (!parsedResponse.generatedQuery) {
      return res.status(500).json({ message: "Invalid AI response: 'generatedQuery' missing." });
    }

    // Save to schema history
    schema.history.push({
      prompt,
      generatedQuery: parsedResponse.generatedQuery,
      databaseType,
    });
    await schema.save();

    // Respond with the generated SQL
    res.status(200).json({ message: "Query generated successfully", sql: parsedResponse.generatedQuery });
  } catch (error) {
    console.error("Error generating query:", error.message, error.stack);
    res.status(500).json({ message: "Query generation failed", error: error.message });
  }
});




// POST: Save Favorite Query
router.post("/:id/save-query", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { queryName, queryText } = req.body;

    if (!queryName || !queryText) {
      return res.status(400).json({ message: "Query name and text are required." });
    }

    const schema = await Schema.findById(id);
    if (!schema) {
      return res.status(404).json({ message: "Schema not found." });
    }

    if (schema.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    schema.favorites.push({ name: queryName, query: queryText });
    await schema.save();

    res.status(201).json({ message: "Query saved successfully." });
  } catch (error) {
    console.error("Error saving favorite query:", error.message);
    res.status(500).json({ message: "Failed to save favorite query.", error: error.message });
  }
});


// GET: Fetch Query History
router.get("/:id/history", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const schema = await Schema.findById(id);
    if (!schema) {
      return res.status(404).json({ message: "Schema not found." });
    }

    if (schema.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    res.status(200).json({ history: schema.history });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET: Fetch Favorite Queries
router.get("/:id/favorites", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const schema = await Schema.findById(id);
    if (!schema) {
      return res.status(404).json({ message: "Schema not found." });
    }

    if (schema.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    res.status(200).json({ favorites: schema.favorites });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE: Remove a Favorite Query
router.delete("/:id/favorites/:favoriteId", verifyToken, async (req, res) => {
  try {
    const { id, favoriteId } = req.params;

    const schema = await Schema.findById(id);
    if (!schema) {
      return res.status(404).json({ message: "Schema not found." });
    }

    if (schema.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    schema.favorites = schema.favorites.filter((fav) => fav._id.toString() !== favoriteId);
    await schema.save();

    res.status(200).json({ message: "Favorite removed successfully", favorites: schema.favorites });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST: Validate SQL Query
router.post("/:id/validate-query", verifyToken, validateQuerySafety, async (req, res) => {
  const { id } = req.params;
  const { query, dbConfig } = req.body;

  if (!query || !dbConfig) {
    return res.status(400).json({ message: "Query and database configuration are required." });
  }

  try {
    const schema = await Schema.findById(id);
    if (!schema) {
      return res.status(404).json({ message: "Schema not found." });
    }

    if (schema.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // Mock or actual database connection
    const { host, port, user, password, database } = dbConfig;

    // Example with PostgreSQL
    const { Client } = require("pg");
    const client = new Client({ host, port, user, password, database });

    await client.connect();
    const result = await client.query(query);
    await client.end();

    res.status(200).json({ message: "Query executed successfully", result });
  } catch (error) {
    console.error("Error validating query:", error.message);
    res.status(500).json({ message: "Query validation failed", error: error.message });
  }
});



module.exports = router;
