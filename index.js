#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const parentDir = process.env.INIT_CWD;

if (!parentDir) {
    console.error('INIT_CWD environment variable is not set. Unable to find parent directory.');
    process.exit(1);
}

const sourceFile = path.join(__dirname, 'deepPopulate.js');
const destinationDir = path.join(parentDir, 'src', 'middleware');
const destinationFile = path.join(destinationDir, 'deepPopulate.js');

const configDir = path.join(parentDir, 'config');
const middlewareFileJS = path.join(configDir, 'middlewares.js');
const middlewareFileTS = path.join(configDir, 'middlewares.ts');

async function modifyMiddlewareFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');

        // Check if the entry already exists to prevent duplication
        if (content.includes('global::deepPopulate')) {
            console.log(`\x1b[32mMiddleware entry already exists in ${path.basename(filePath)}. No changes needed.\x1b[0m`);
            return;
        }

        // Split the content by lines to find the last item in the array
        const lines = content.split('\n');
        let modified = false;

        // Iterate through the lines backwards
        for (let i = lines.length - 1; i >= 0; i--) {
            // Find the last item that ends with a comma
            if (lines[i].trim().endsWith(',')) {
                lines[i] = lines[i] + `\n  'global::deepPopulate',`;
                modified = true;
                break;
            }
        }

        // If the file was not structured as expected, add the line before the closing bracket
        if (!modified) {
            const insertionPoint = content.lastIndexOf(']');
            if (insertionPoint !== -1) {
                content = content.substring(0, insertionPoint) + `  'global::deepPopulate',\n` + content.substring(insertionPoint);
            }
        } else {
            content = lines.join('\n');
        }

        // Write the modified content back to the file
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`\x1b[32mSuccessfully added 'global::deepPopulate' to ${path.basename(filePath)}.\x1b[0m`);
    } catch (err) {
        console.error(`\x1b[31mError modifying middleware file ${filePath}: ${err.message}\x1b[0m`);
        process.exit(1);
    }
}

(async function () {

    try {
        // 1. Create the destination directory recursively if it doesn't exist
        await fs.mkdir(destinationDir, { recursive: true });
        console.log(`\x1b[32m1.Created directory: ${destinationDir}\x1b[0m`);

        // 2. Copy the file from the package to the parent project
        await fs.copyFile(sourceFile, destinationFile);
        console.log(`\x1b[32m2.Successfully copied ${sourceFile} to ${destinationFile}\x1b[0m`);

        // 3. Modify the middleware configuration file to include the new middleware
        // Step 2: Check for middleware.js or middleware.ts in the parent's config folder
        if (await fileExists(middlewareFileJS)) {
            await modifyMiddlewareFile(middlewareFileJS);
        } else if (await fileExists(middlewareFileTS)) {
            await modifyMiddlewareFile(middlewareFileTS);
        } else {
            console.warn('\x1b[31mNeither middleware.js nor middleware.ts found in the parent config folder.\x1b[0m');
        }
    } catch (err) {
        console.error(`\x1b[31mAn error occurred during postinstall script: ${err.message}\x1b[0m`);
        process.exit(1);
    }

})();


// Helper function to check if a file exists
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

