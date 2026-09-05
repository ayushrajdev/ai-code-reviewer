import fs, { readFile } from 'node:fs/promises';
import path from 'path';

export default async function read_file({ path_url }) {
    try {
        const full_path = path.join('../', path_url);
        const content = await readFile(full_path, 'utf-8');
        return {
            success: true,
            message: `reading file successfully : ${path_url}`,
            content: content,
        };
    } catch (error) {
        return {
            success: false,
            message: `cannot read file : ${path_url}`,
        };
    }
}

