import fs, { writeFile } from 'node:fs/promises';
import path from 'path';

export default async function write_file({ path_url, content }) {
    try {
        const full_path = path.join('../', path_url);
        await writeFile(full_path, content);
        console.log(`written to file ${path_url}`)
        return {
            success: true,
            message: `Written in file successfully : ${path_url}`,
        };
    } catch (error) {
        return {
            success: false,
            message: `cannot write in file : ${path_url}`,
        };
    }
}
