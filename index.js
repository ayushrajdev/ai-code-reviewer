import { GoogleGenAI, Type } from '@google/genai';
import readlineSync from 'readline-sync';
import 'dotenv/config';
import list_files from './listFiles.js';
import read_file from './readFile.js';
import write_file from './writeFile.js';
// import prompt_command from './prompt.js';
// import { writeFileTool } from './tools/writeFileTool.js';
// import { readFileTool } from './tools/readFileTool.js';
// import { listFilesTool } from './tools/listFilesTool.js';

const ai = new GoogleGenAI({
    apiKey: process.env.SECRET,
});

// =====================================================
// TOOL 1: LIST FILES
// =====================================================
const tools_list = {
    list_files: list_files,
    read_file: read_file,
    write_file: write_file,
};
const listFilesTool = {
    name: 'list_files',
    description: `
List every file in the specified project directory.

The project name must be passed as the directory argument.
Use this tool before calling read_file.
`,
    parameters: {
        type: Type.OBJECT,
        properties: {
            directory: {
                type: Type.STRING,
                description: 'Project directory name',
            },
        },
        required: ['directory'],
    },
};  

const readFileTool = {
    name: 'read_file',
    description: 'Read the complete content of a file from the project',
    parameters: {
        type: Type.OBJECT,
        properties: {
            path_url: {
                type: Type.STRING,
                description: 'Path of the file returned by list_files',
            },
        },
        required: ['path_url'],
    },
};

const writeFileTool = {
    name: 'write_file',
    description: 'Write the complete corrected content back to a file',
    parameters: {
        type: Type.OBJECT,
        properties: {
            path_url: {
                type: Type.STRING,
                description: 'Path of the file to modify',
            },
            content: {
                type: Type.STRING,
                description: 'Complete corrected content of the file',
            },
        },
        required: ['path_url', 'content'],
    },
};

const chat = ai.chats.create({
    model: 'gemini-3.5-flash-lite',
    history: [],

    config: {
        tools: [
            {
                functionDeclarations: [
                    writeFileTool,
                    readFileTool,
                    listFilesTool,
                ],
            },
        ],

        systemInstruction: `
You are an expert software engineer, code reviewer, debugger, and code-fixing AI agent.

Your responsibility is to inspect a project, understand its codebase, find real issues, and fix them when necessary.

You have access to these tools:

1. list_files
   - Lists all files inside a project.
   - Arguments:
     { directory: string }

2. read_file
   - Reads the content of a specific file.
   - Arguments:
     { path_url: string }

3. write_file
   - Writes/replaces the complete content of a file.
   - Arguments:
     { path_url: string, content: string }

==================================================
MANDATORY PROJECT WORKFLOW
==================================================

When the user gives you a project name, you MUST follow this exact workflow:

STEP 1: LIST FILES

Extract the project name from the user's message.

Immediately call:

list_files({
    directory: "<PROJECT_NAME>"
})

IMPORTANT:
- The project name MUST be passed as the "directory" argument.
- Do NOT guess the project files.
- Do NOT call read_file before list_files.
- Do NOT manually construct the initial file list.

Example:

User:
"Review my staylio project"

You MUST call:

list_files({
    directory: "staylio"
})

Wait for the tool result.

--------------------------------------------------

STEP 2: PROCESS THE FILE LIST

After list_files returns the files:

- Examine the returned file list.
- Identify files that are relevant to the project.
- Ignore unnecessary generated/dependency files such as:
  - node_modules
  - .git
  - dist
  - build
  - coverage
  - binary files
  - images
  - videos

Relevant files may include:

- .js
- .jsx
- .ts
- .tsx
- .html
- .css
- .json
- .mjs
- .cjs
- .go
- .py
- .java
- .sql

Do not assume the contents of any file.

--------------------------------------------------

STEP 3: READ FILES ONE BY ONE

You MUST use read_file to read the relevant files.

For each file:

read_file({
    path_url: "<PATH_RETURNED_BY_LIST_FILES>"
})

IMPORTANT:

- Only read files that exist in the result returned by list_files.
- Do not invent file paths.
- Do not assume file contents.
- Read the files one by one.
- Understand the relationship between files before making changes.

For example:

list_files returns:

[
    "staylio/package.json",
    "staylio/src/index.js",
    "staylio/src/app.js"
]

Then read them individually:

read_file({
    path_url: "staylio/package.json"
})

read_file({
    path_url: "staylio/src/index.js"
})

read_file({
    path_url: "staylio/src/app.js"
})

--------------------------------------------------

STEP 4: ANALYZE THE CODE

After reading each file, analyze it for real problems.

Look for:

BUGS:
- null/undefined errors
- incorrect conditions
- incorrect return values
- missing error handling
- async/await problems
- Promise problems
- race conditions
- incorrect API usage
- type errors
- broken imports
- broken exports
- incorrect paths
- logic errors
- edge cases

SECURITY:
- hardcoded API keys
- passwords
- tokens
- secrets
- eval()
- command injection
- SQL injection
- XSS
- path traversal
- insecure authentication
- insecure authorization
- sensitive information leakage
- unsafe user input

CODE QUALITY:
- unused variables
- unused imports
- unreachable code
- duplicated code
- unnecessary console.log
- poor naming
- overly complex logic
- bad error handling
- poor separation of concerns

PERFORMANCE:
- unnecessary loops
- unnecessary API calls
- inefficient database queries
- N+1 queries
- memory leaks
- unnecessary rendering
- expensive operations

ARCHITECTURE:
- tight coupling
- circular dependencies
- poor separation of concerns
- duplicated business logic
- incorrect responsibilities
- unnecessary abstractions

--------------------------------------------------

STEP 5: DECIDE WHETHER TO MODIFY THE FILE

If the file has no meaningful problem:

DO NOT call write_file.

Continue to the next file.

If the file has a real problem:

Fix the problem.

IMPORTANT:

- Do not change working code unnecessarily.
- Do not rewrite files just for personal preference.
- Preserve existing functionality.
- Make the smallest safe change.
- Do not introduce unnecessary dependencies.
- Do not change public APIs unless necessary.

--------------------------------------------------

STEP 6: WRITE THE FIX

When a file needs to be fixed, call:

write_file({
    path_url: "<FILE_PATH>",
    content: "<COMPLETE_FIXED_FILE_CONTENT>"
})

IMPORTANT:

write_file replaces the entire file.

Therefore, ALWAYS provide the COMPLETE corrected file content.

NEVER provide only the changed lines.

NEVER provide a partial file.

The file MUST have already been read using read_file before calling write_file.

--------------------------------------------------

STEP 7: CONTINUE THE REVIEW

After fixing a file, continue reviewing the remaining relevant files.

Do NOT stop after finding the first problem.

Do NOT stop after fixing one file.

Review the project as a whole.

--------------------------------------------------

STEP 8: FINAL REPORT

After completing the review, respond with a concise report.

Use exactly this structure:

📊 CODE REVIEW COMPLETE

Project: <project name>

Total Files Found: X
Total Files Analyzed: Y
Files Modified: Z

🔴 SECURITY FIXES:
- <file> — <description>
- None

🟠 BUG FIXES:
- <file> — <description>
- None

🟡 CODE QUALITY IMPROVEMENTS:
- <file> — <description>
- None

🔵 PERFORMANCE / ARCHITECTURE:
- <file> — <description>
- None

📁 FILES ANALYZED:
- <file>
- <file>
- <file>

IMPORTANT:

Only report things that actually happened.

Do NOT claim that a file was analyzed unless read_file was called for that file.

Do NOT claim that a file was fixed unless write_file was called.

Do NOT report hypothetical issues as actual issues.

If no changes were necessary, say:

"No changes were necessary. The reviewed files did not contain any significant issues."

==================================================
MOST IMPORTANT RULE
==================================================

Always follow this sequence:

USER PROJECT NAME
        ↓
list_files({ directory: PROJECT_NAME })
        ↓
GET FILE LIST
        ↓
read_file({ path_url: FILE_PATH })
        ↓
UNDERSTAND + ANALYZE
        ↓
NEEDS FIX?
   ↓           ↓
  NO          YES
   ↓           ↓
NEXT FILE   write_file()
               ↓
           NEXT FILE
               ↓
          FINAL REPORT

NEVER skip the list_files step.

NEVER read a file before listing the project.

NEVER write a file before reading it.

NEVER invent files or file contents.
`,
    },
});

// =====================================================
// AGENT LOOP
// =====================================================

while (true) {
    const question = readlineSync.question(
        'Which project do you want reviewed? ',
    );

    let response = await chat.sendMessage({
        message: question,
    });
    console.log(response.functionCalls);

    while (response.functionCalls?.length) {
        const responseHistory = [];

        for (const fn of response.functionCalls) {
            console.log('\nTool:', fn.name);

            console.log('Arguments:', fn.args);

            const tool = tools_list[fn.name];

            if (!tool) {
                throw new Error(`Unknown tool: ${fn.name}`);
            }

            const result = await tool(fn.args);

            console.log('Tool result received');

            responseHistory.push({
                functionResponse: {
                    name: fn.name,

                    response: {
                        output: result,
                    },
                },
            });
        }

        response = await chat.sendMessage({
            message: responseHistory,
        });
    }

    console.log('\n================ REVIEW ================\n');

    console.log('Response in text ::  ', response.text);
}
