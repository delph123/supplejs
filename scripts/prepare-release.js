#!/usr/bin/env node

import { promises as fs } from "node:fs";
import { join } from "node:path";

async function copyFiles(files, dest) {
    return Promise.all(
        files.map(async (file) => {
            await fs.copyFile(file, join(dest, file));
        }),
    );
}

async function readJSON(file) {
    let data = await fs.readFile(file);
    return JSON.parse(data.toString());
}

async function writeJSON(content, file) {
    let data = JSON.stringify(content, null, 2);
    await fs.writeFile(file, data);
}

async function cleanPackageJson() {
    const packageJson = await readJSON("package.json");
    const outPackageJson = { ...packageJson, ...packageJson["clean-package"] };
    if ("delete" in packageJson["clean-package"]) {
        packageJson["clean-package"].delete.forEach((key) => {
            delete outPackageJson[key];
        });
        delete outPackageJson["delete"];
    }
    await writeJSON(outPackageJson, "build/package.json");
    return outPackageJson;
}

async function fixVersionExport(files, version) {
    for (const file of files) {
        let data = await fs.readFile(join("build/lib", file), { encoding: "utf-8" });
        data = data.replace(
            'export { version } from "../../package.json"',
            `export const version = "${version}"`,
        );
        await fs.writeFile(join("build/lib", file), data, { encoding: "utf-8" });
    }
}

async function fixImportExtensions() {
    const jsFiles = await fs.readdir("build/lib");
    jsFiles
        .filter((f) => f.endsWith(".js"))
        .forEach(async (filepath) => {
            const data = await fs.readFile(join("build/lib", filepath), { encoding: "utf-8" });
            let newData = data.replace(/(import|export .* from\s+['"])(.*)(?=['"])/g, "$1$2.js");
            if (newData === data) {
                return;
            }
            await fs.writeFile(join("build/lib", filepath), newData, { encoding: "utf-8" });
        });
}

async function run() {
    await copyFiles(["LICENSE", "README.md"], "build");
    const packageJson = await cleanPackageJson();
    await fixVersionExport(["index.js", "index.d.ts"], packageJson.version);
    await fixImportExtensions();
}

run().catch((error) => {
    process.stderr.write(error.stack + "\n");
    process.exit(1);
});
