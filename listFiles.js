import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { Type } from '@google/genai';

export default async function list_files({ directory }) {
    try {
        const files = [];

        // ../staylio
        const projectPath = path.resolve('../', directory);

        // ../
        // We use this so the returned path contains "staylio/"
        const parentPath = path.dirname(projectPath);

        async function scan(currentPath) {
            const entries = await readdir(currentPath, {
                withFileTypes: true,
            });

            for (const entry of entries) {
                const entryPath = path.join(currentPath, entry.name);

                // Ignore directories
                if (
                    entry.isDirectory() &&
                    ['node_modules', '.git', 'dist', 'build'].includes(
                        entry.name,
                    )
                ) {
                    continue;
                }

                if (entry.isDirectory()) {
                    await scan(entryPath);
                }

                if (entry.isFile()) {
                    const relativePath = path.relative(parentPath, entryPath);

                    // Convert Windows "\" to "/"
                    files.push(relativePath.split(path.sep).join('/'));
                }
            }
        }

        await scan(projectPath);
        console.log(files);
        return {
            files,
        };
    } catch (error) {
        return {
            success: false,
            message:`cannot read the files in directory ${directory}`,
        };
    }
}
