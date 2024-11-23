import { parseArgs } from 'jsr:@std/cli/parse-args';
import path from 'node:path';
import myPackage from '../deno.json' with { type: 'json' };
import { getDataLink } from './helpers/getDataLink.ts';
import { downloadFile } from './helpers/downloadFile.ts';
import { getLinksByText } from './utils/getLinksByText.ts';
import { help } from './helpers/help.ts';

// Arguments parse
const args = Deno.args;

// Checking arguments
if (!args.length) {
  console.log('Any argument passed :V');
  Deno.exit();
}

const flags = parseArgs(args, {
  boolean: ['help', 'version'],
  string: ['input-file', 'output', 'output-dir'],
  alias: {
    h: 'help',
    v: 'version',
    i: 'input-file',
    o: 'output'
  }
});

// Just print the version
if (flags.version) {
  console.log(myPackage.version);
  Deno.exit();
}

// Print the help
if (flags.help) {
  console.info(help);
  Deno.exit();
}

// Getting data for config:
const outputDir = flags['output-dir'] as string;

if (flags.output && outputDir) {
  console.log('Is not possible have a config with "output" and "output-dir" together in the same time');
  Deno.exit();
}

// Vault links
let links: string[] = [];

// If have more of one link
const inputFile = flags['input-file'] as string;
if (inputFile) {
  try {
    const linksInFile = await getLinksByText(inputFile);
    links = linksInFile;
  } catch (err) {
    console.error(err);
    Deno.exit();
  }
} else {
  // of just one link passing by argument
  const mediafireLink = args.find((arg) => arg.includes('https://www.mediafire.com'));
  if (!mediafireLink) {
    console.error('No Mediafire link found it!');
    Deno.exit();
  }
  links.push(mediafireLink);
}

// Starting processing
for await (const link of links) {
  try {
    const { nameFile, href } = await getDataLink(link);
    const destination = flags.output ?? path.join(outputDir ?? './', nameFile);
    console.log('Downloading …');
    console.log(`From: ${link}`);
    console.log(`To: ${destination}`);
    await downloadFile(href, destination);
  } catch (err) {
    console.error(`Unprocessable download: ${link}`);
    console.error(err);
  }
  console.log('\n');
}

Deno.exit();
