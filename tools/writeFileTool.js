import { Type } from '@google/genai';

export const writeFileTool = {
    name: 'write_file',
    description: 'Write fixed content back to a file',
    parameters: {
        type: Type.OBJECT,
        properties: {
            file_path: {
                type: Type.STRING,
                description: 'Path to the file to write',
            },
            content: {
                type: Type.STRING,
                description: 'The fixed/corrected content',
            },
        },
        required: ['file_path', 'content'],
    },
};
