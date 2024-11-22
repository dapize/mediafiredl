import { getDataLink } from './helpers/getDataLink';
import { parseArgs } from 'node:util';
import myPackage from '../package.json';
import { downloadFile } from "./helpers/downloadFile";
import { getLinksByText } from './utils/getLinksByText';
import { Browser } from './helpers/Browser';
import path from 'node:path';

// Arguments parse
const args = process.argv.slice(2);

// Checking arguments
if (!args.length) {
  console.log('Any argument passed :V');
  process.exit();
}

const {
  values: flags
} = parseArgs({
  args,
  options: {
    help: {
      type: 'boolean',
      short: 'h',
    },
    version: {
      type: 'boolean',
      short: 'v',
    },
    'input-file': {
      type: 'string',
      short: 'i'
    },
    'output': {
      type: 'string',
      short: 'o'
    },
    'output-dir': {
      type: 'string'
    },
    config: {
      type: 'string',
    }
  },
  strict: false
});

// Just print the version
if (flags.version) {
  console.log(myPackage.version);
  process.exit();
}

// Getting data for config:
let outputDir = flags['output-dir'] as string;
outputDir = outputDir || './';

if (flags.output && outputDir) {
  console.log('Is not possible have a config with "output" and "output-dir" together in the same time');
  process.exit();
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
    process.exit();
  }
} else {
  // of just one link passing by argument
  const mediafireLink = args.find(arg => arg.includes('https://www.mediafire.com'));
  if (!mediafireLink) {
    console.error('No Mediafire link found it!')
    process.exit();
  }
  links.push(mediafireLink);
}

// Starting processing
for await (const link of links) {
  try {
    const { nameFile, href } = await getDataLink(link);
    const destination = path.join(outputDir, nameFile);
    console.log('Downloading …');
    console.log(`From: ${link}`);
    console.log(`To: ${destination}`);
    await downloadFile(href, destination);
  } catch (err) {
    console.error(`Unprocessable download: ${link}`)
    console.error(err);
  }
  console.log('\n');
}

const browser = new Browser();
browser.close();
process.exit();
