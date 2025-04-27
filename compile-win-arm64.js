import { existsSync, readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { execSync } from "node:child_process";
import process from "node:process";
import { inject } from "postject";

(async () => {
  const exePath = "./bin/mediafiredl_win-arm64.exe";
  const seaBlobPath = "./sea-prep.blob";
  try {
    for await (const filePath of [exePath, seaBlobPath]) {
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }
    execSync("node --no-warnings --experimental-sea-config sea-config.json");
    if (!existsSync("./bin")) {
      mkdirSync("./bin");
    }
    copyFileSync(process.execPath, exePath);
    execSync(`signtool remove /s ${exePath}`);
    const resourceBlob = readFileSync(seaBlobPath);
    await inject(exePath, "NODE_SEA_BLOB", resourceBlob, {
      sentinelFuse: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
    });
    await unlink(seaBlobPath);
  } catch (err) {
    throw new Error(err);
  }
})();
