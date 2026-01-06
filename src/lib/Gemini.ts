// src/lib/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ERModel, SchemaFormat, DetectionResult } from "@/types/ERmodel"

/**
 * Initialize Gemini client
 */
let genAI: GoogleGenerativeAI | null = null;

export function initGemini(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not found in environment");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Detect schema format from content
 */
export function detectSchemaFormat(content: string): DetectionResult {
  const contentLower = content.toLowerCase();
  const first100Lines = content.split("\n").slice(0, 100).join("\n");

  // SQL Detection
  if (/CREATE\s+TABLE/i.test(first100Lines)) {
    return {
      format: "sql",
      confidence: "high",
      prompt: getFormatPrompt("sql"),
    };
  }

  // Prisma Detection
  if (/model\s+\w+\s*{/.test(content) && /@/.test(content)) {
    return {
      format: "prisma",
      confidence: "high",
      prompt: getFormatPrompt("prisma"),
    };
  }

  // Convex Detection
  if (/defineTable|defineSchema/.test(content)) {
    return {
      format: "convex",
      confidence: "high",
      prompt: getFormatPrompt("convex"),
    };
  }

  // TypeScript Detection
  if (/(interface|type)\s+\w+/.test(content)) {
    return {
      format: "typescript",
      confidence: "medium",
      prompt: getFormatPrompt("typescript"),
    };
  }

  // Mongoose Detection
  if (/new\s+Schema|mongoose\.Schema/.test(content)) {
    return {
      format: "mongoose",
      confidence: "high",
      prompt: getFormatPrompt("mongoose"),
    };
  }

  // GraphQL Detection
  if (/type\s+\w+\s*{/.test(content) && /schema\s*{/.test(contentLower)) {
    return {
      format: "graphql",
      confidence: "medium",
      prompt: getFormatPrompt("graphql"),
    };
  }

  // Unknown format
  return {
    format: "unknown",
    confidence: "low",
    prompt: getFormatPrompt("unknown"),
  };
}

//Get format-specific parsing prompt
export function getFormatPrompt(format: SchemaFormat): string {
  const baseInstructions = `
You are a database schema expert. Your task is to analyze the provided schema and extract entities, fields, and relationships.

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON (no markdown, no code blocks, no explanations)
- Follow the exact ERModel structure defined below
- Be precise and accurate
- Do not hallucinate or invent relationships

ERModel JSON Structure:
{
  "entities": [
    {
      "name": "table_name",
      "description": "brief description",
      "fields": [
        {
          "name": "field_name",
          "type": "data_type",
          "isPrimary": boolean,
          "isForeign": boolean,
          "isRequired": boolean,
          "isUnique": boolean,
          "foreignTable": "referenced_table_name" (if isForeign is true)
        }
      ],
      "relations": [
        {
          "from": "this_table",
          "to": "other_table",
          "type": "1-1" | "1-M" | "M-1" | "M-M",
          "fromField": "field_name",
          "toField": "field_name"
        }
      ]
    }
  ]
}
`;

  const formatSpecific: Record<SchemaFormat, string> = {
    sql: `
SQL DDL SPECIFIC INSTRUCTIONS:
1. Extract tables from CREATE TABLE statements
2. Identify PRIMARY KEY from PRIMARY KEY constraint or column definition
3. Identify FOREIGN KEY from FOREIGN KEY constraints or REFERENCES clause
4. Determine field types from SQL data types (VARCHAR, INT, DATETIME, etc.)
5. Detect NOT NULL for isRequired
6. Detect UNIQUE constraints for isUnique
7. Infer relationship types:
   - 1-1: FK with UNIQUE constraint
   - 1-M: FK without UNIQUE (most common)
   - M-M: Junction table with 2+ FKs

Example SQL:
CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));
CREATE TABLE posts (id INT PRIMARY KEY, user_id INT REFERENCES users(id));

Expected Output:
{
  "entities": [
    {
      "name": "users",
      "fields": [{"name": "id", "type": "INT", "isPrimary": true, "isForeign": false}],
      "relations": []
    },
    {
      "name": "posts",
      "fields": [
        {"name": "id", "type": "INT", "isPrimary": true, "isForeign": false},
        {"name": "user_id", "type": "INT", "isForeign": true, "foreignTable": "users"}
      ],
      "relations": [{"from": "posts", "to": "users", "type": "M-1", "fromField": "user_id"}]
    }
  ]
}
`,

    prisma: `
PRISMA SCHEMA SPECIFIC INSTRUCTIONS:
1. Extract models as entities
2. @id decorator indicates primary key
3. @relation decorator indicates foreign key relationship
4. Field with @relation has isForeign: true
5. Determine relationship type:
   - Array field (posts Post[]) = 1-M or M-M
   - Single field (user User) = M-1 or 1-1
   - Check both sides to determine exact type
6. Use Prisma scalar types (String, Int, DateTime, Boolean, etc.)
7. Optional fields (field?) have isRequired: false

Example Prisma:
model User {
  id    Int    @id
  posts Post[]
}
model Post {
  id     Int  @id
  userId Int
  user   User @relation(fields: [userId], references: [id])
}

Expected Output:
{
  "entities": [
    {
      "name": "User",
      "fields": [{"name": "id", "type": "Int", "isPrimary": true}],
      "relations": [{"from": "User", "to": "Post", "type": "1-M"}]
    },
    {
      "name": "Post",
      "fields": [
        {"name": "id", "type": "Int", "isPrimary": true},
        {"name": "userId", "type": "Int", "isForeign": true, "foreignTable": "User"}
      ],
      "relations": [{"from": "Post", "to": "User", "type": "M-1", "fromField": "userId"}]
    }
  ]
}
`,

    convex: `
CONVEX SCHEMA SPECIFIC INSTRUCTIONS:
1. Extract tables from defineTable() calls
2. _id is always the primary key (auto-generated)
3. v.id("tableName") indicates foreign key to that table
4. Use Convex field types (v.string(), v.number(), v.boolean(), etc.)
5. v.optional() means isRequired: false
6. All FK relationships are M-1 (many records can reference one)

Example Convex:
defineSchema({
  users: defineTable({ name: v.string() }),
  posts: defineTable({ userId: v.id("users"), title: v.string() })
})

Expected Output:
{
  "entities": [
    {
      "name": "users",
      "fields": [
        {"name": "_id", "type": "Id", "isPrimary": true},
        {"name": "name", "type": "string", "isRequired": true}
      ],
      "relations": []
    },
    {
      "name": "posts",
      "fields": [
        {"name": "_id", "type": "Id", "isPrimary": true},
        {"name": "userId", "type": "Id", "isForeign": true, "foreignTable": "users"},
        {"name": "title", "type": "string"}
      ],
      "relations": [{"from": "posts", "to": "users", "type": "M-1", "fromField": "userId"}]
    }
  ]
}
`,

    typescript: `
TYPESCRIPT INTERFACES/TYPES SPECIFIC INSTRUCTIONS:
1. Treat interfaces/types as entities
2. Infer primary key from field named "id" or "_id"
3. Infer foreign keys from:
   - Field names ending in "Id" (userId → references users)
   - Field types referencing other interfaces (user: User → FK to User)
4. Array types (posts: Post[]) indicate 1-M relationship
5. Optional fields (field?: type) have isRequired: false

Example TypeScript:
interface User { id: string; name: string; }
interface Post { id: string; userId: string; user: User; }

Expected Output:
{
  "entities": [
    {
      "name": "User",
      "fields": [{"name": "id", "type": "string", "isPrimary": true}],
      "relations": []
    },
    {
      "name": "Post",
      "fields": [
        {"name": "id", "type": "string", "isPrimary": true},
        {"name": "userId", "type": "string", "isForeign": true, "foreignTable": "User"}
      ],
      "relations": [{"from": "Post", "to": "User", "type": "M-1", "fromField": "userId"}]
    }
  ]
}
`,

    mongoose: `
MONGOOSE SCHEMA SPECIFIC INSTRUCTIONS:
1. Extract schemas as entities
2. _id is always primary key (auto-generated by MongoDB)
3. Fields with type: mongoose.Schema.Types.ObjectId and ref indicate FK
4. Use MongoDB types (String, Number, Date, Boolean, ObjectId)
5. required: true means isRequired: true
6. Array fields ([{ type: ... }]) indicate 1-M or M-M

Example Mongoose:
const userSchema = new Schema({ name: String });
const postSchema = new Schema({
  userId: { type: ObjectId, ref: 'User' }
});

Expected Output:
{
  "entities": [
    {
      "name": "User",
      "fields": [{"name": "_id", "type": "ObjectId", "isPrimary": true}],
      "relations": []
    },
    {
      "name": "Post",
      "fields": [
        {"name": "_id", "type": "ObjectId", "isPrimary": true},
        {"name": "userId", "type": "ObjectId", "isForeign": true, "foreignTable": "User"}
      ],
      "relations": [{"from": "Post", "to": "User", "type": "M-1"}]
    }
  ]
}
`,

    graphql: `
GRAPHQL SCHEMA SPECIFIC INSTRUCTIONS:
1. Extract type definitions as entities
2. Field named "id" is primary key
3. Fields referencing other types are foreign keys
4. Array types ([Post]) indicate 1-M relationship
5. Non-null fields (field: String!) have isRequired: true

Example GraphQL:
type User { id: ID!; name: String!; posts: [Post] }
type Post { id: ID!; userId: ID!; user: User }

Expected Output:
{
  "entities": [
    {
      "name": "User",
      "fields": [{"name": "id", "type": "ID", "isPrimary": true, "isRequired": true}],
      "relations": [{"from": "User", "to": "Post", "type": "1-M"}]
    },
    {
      "name": "Post",
      "fields": [
        {"name": "id", "type": "ID", "isPrimary": true},
        {"name": "userId", "type": "ID", "isForeign": true, "foreignTable": "User"}
      ],
      "relations": [{"from": "Post", "to": "User", "type": "M-1"}]
    }
  ]
}
`,

    unknown: `
UNKNOWN FORMAT - GENERIC INSTRUCTIONS:
1. Intelligently identify entities (tables/collections/models)
2. Identify fields with their types
3. Infer primary keys (usually "id" or "_id")
4. Infer foreign keys from:
   - Field names (userId, postId, etc.)
   - Type references
   - Relationship keywords
5. Infer relationship types based on field patterns
6. Make educated guesses but mark confidence if uncertain

Be smart and adaptive. Look for patterns that indicate database structure.
`,
  };

  return baseInstructions + formatSpecific[format];
}

/**
 * Parse schema with Gemini
 */
export async function parseSchemaWithGemini(
  schemaContent: string,
  formatHint?: SchemaFormat
): Promise<ERModel> {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Detect format if not provided
  const detection = formatHint
    ? { format: formatHint, prompt: getFormatPrompt(formatHint) }
    : detectSchemaFormat(schemaContent);

  const prompt = `${detection.prompt}

SCHEMA TO PARSE:
\`\`\`
${schemaContent}
\`\`\`

Remember: Return ONLY valid JSON following the ERModel structure. No markdown, no explanations.`;

  try {
    console.log("Calling Gemini API for schema parsing...");
    
    // Retry logic for network failures
    let lastError: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        // Parse response
        const cleaned = text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        try {
          const parsed = JSON.parse(cleaned) as ERModel;
          console.log(`Schema parsed successfully: ${parsed.entities.length} entities`);
          // Add timestamp
          parsed.timestamp = new Date().toISOString();
          return parsed;
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", cleaned);
          throw new Error(`Invalid JSON response from Gemini: ${cleaned.substring(0, 100)}...`);
        }
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          console.log(`Attempt ${attempt} failed, retrying in ${attempt}s...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }
    
    throw lastError;
  } catch (error: unknown) {
    console.error("Gemini parsing error:", error);
    throw new Error(
      `Failed to parse schema: ${error instanceof Error ? error.message : String(error) || "Unknown error"}`
    );
  }
}