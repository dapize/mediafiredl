import { build } from 'esbuild';

const sharedConfig = {
  entryPoints: ["./src/main.ts"],
  bundle: true,
  minify: false
};

build({
  ...sharedConfig,
  platform: 'node',
  format: 'esm',
  outfile: "./dist/mediafiredl.js",
});
