#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const parentDir = process.env.INIT_CWD;

if (!parentDir) {
    console.error('INIT_CWD environment variable is not set. Unable to find parent directory.');
    process.exit(1);
}

const sourceFileTs = path.join(__dirname, 'deepPopulate.ts');
const sourceFileJs = path.join(__dirname, 'deepPopulate.js');
const destinationDir = path.join(parentDir, 'src', 'middlewares');
const destinationFileTs = path.join(destinationDir, 'deepPopulate.ts');
const destinationFileJs = path.join(destinationDir, 'deepPopulate.js');

const configDir = path.join(parentDir, 'config');
const middlewareFileJS = path.join(configDir, 'middlewares.js');
const middlewareFileTS = path.join(configDir, 'middlewares.ts');

const sourceApiDir = path.join(__dirname, 'api');
const destinationApiDir = path.join(parentDir, 'src', 'api');

const sourceComponentsDir = path.join(__dirname, 'components');
const destinationComponentsDir = path.join(parentDir, 'src', 'components');

const dataImportFileTs = path.join(__dirname, 'my-strapi-export-ts.tar.gz');
const dataImportFileJs = path.join(__dirname, 'my-strapi-export-js.tar.gz');
const destinationDataImportFile = path.join(parentDir, 'my-strapi-export.tar.gz');

function isTypeScriptInstalled() {
    const packageJsonPath = path.join(parentDir, 'package.json');
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        const hasTypeScriptDependency =
            (packageJson.dependencies && packageJson.dependencies.hasOwnProperty('typescript')) ||
            (packageJson.devDependencies && packageJson.devDependencies.hasOwnProperty('typescript'));

        return hasTypeScriptDependency;
    } catch (error) {
        console.error('Error reading or parsing package.json:', error);
        return false;
    }
}

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
        console.log(`\x1b[32m3. Successfully added 'global::deepPopulate' to ${path.basename(filePath)}.\x1b[0m`);
    } catch (err) {
        console.error(`\x1b[31mError modifying middleware file ${filePath}: ${err.message}\x1b[0m`);
        process.exit(1);
    }
}

(async function () {

    try {
        // 1. Create the destination directory recursively if it doesn't exist
        await fs.mkdir(destinationDir, { recursive: true });
        console.log(`\x1b[32m1. Created directory: ${destinationDir}\x1b[0m`);

        // 2. Copy the file from the package to the parent project
        if (isTypeScriptInstalled()) {
            await fs.copyFile(sourceFileTs, destinationFileTs);
            console.log(`\x1b[32m2. Successfully copied ${sourceFileTs} to ${destinationFileTs}\x1b[0m`);
        } else {
            await fs.copyFile(sourceFileJs, destinationFileJs);
            console.log(`\x1b[32m2. Successfully copied ${sourceFileJs} to ${destinationFileJs}\x1b[0m`);
        }

        // 3. Modify the middleware configuration file to include the new middleware
        // Step 2: Check for middleware.js or middleware.ts in the parent's config folder
        if (await fileExists(middlewareFileJS)) {
            await modifyMiddlewareFile(middlewareFileJS);
        } else if (await fileExists(middlewareFileTS)) {
            await modifyMiddlewareFile(middlewareFileTS);
        } else {
            console.warn('\x1b[31mNeither middleware.js nor middleware.ts found in the parent config folder.\x1b[0m');
        }

        // 4. Copy the api and components directories if they exist
        if (await fileExists(sourceApiDir)) {
            await fs.mkdir(destinationApiDir, { recursive: true });
            await fs.cp(sourceApiDir, destinationApiDir, { recursive: true });
            console.log(`\x1b[32m4. Successfully copied API directory to ${destinationApiDir}\x1b[0m`);
        } else {
            console.warn('\x1b[33mAPI directory does not exist in the package. Skipping copy.\x1b[0m');
        }

        // 5. Copy components directory if it exists
        if (await fileExists(sourceComponentsDir)) {
            await fs.mkdir(destinationComponentsDir, { recursive: true });
            await fs.cp(sourceComponentsDir, destinationComponentsDir, { recursive: true });
            console.log(`\x1b[32m5. Successfully copied Components directory to ${destinationComponentsDir}\x1b[0m`);
        } else {
            console.warn('\x1b[33mComponents directory does not exist in the package. Skipping copy.\x1b[0m');
        }

        // 6. Add import data
        if (await fileExists(parentDir)) {
            if (isTypeScriptInstalled()) {
                await fs.copyFile(dataImportFileTs, destinationDataImportFile);
            } else {
                await fs.copyFile(dataImportFileJs, destinationDataImportFile);
            }
            console.log(`\x1b[32m6. Successfully copied data to ${destinationDataImportFile}\x1b[0m`);
            console.log('\x1b[31m Note: now run this command\x1b[0m \x1b[33mnpm run strapi import -- --file my-strapi-export.tar.gz\x1b[0m');
        }
        else {
            console.warn('\x1b[33mDifficulty in data importing. Skipping data import.\x1b[0m');
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

