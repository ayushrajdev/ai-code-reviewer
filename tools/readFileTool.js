import { Type } from "@google/genai";

export const readFileTool = {
  name: "read_file",
  description: "Read a file's content",
  parameters: {
    type: Type.OBJECT,
    properties: {
      file_path: {
        type: Type.STRING,
        description: "Path to the file"
      }
    },
    required: ["file_path"]
  }
};
