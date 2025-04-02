import { Command } from 'commander';
import { action } from './action.ts';
import { i18n } from '../i18n/i18n.ts';

const program = new Command();

program
	.name('mediafiredl')
	.description(i18n.__('app.description'))
	.version('0.2.0')
	.argument('[links...]', i18n.__('arguments.links'))
	.option('-o, --output <path>', i18n.__('arguments.output'), './')
	.option(
		'-m, --max-downloads <number>',
		i18n.__('arguments.maxDownloads'),
		'2',
	)
	.option('-i, --input-file <path>', i18n.__('arguments.inputFile'))
	.option('-d, --details', i18n.__('arguments.details'), false)
	.option('--inspect', i18n.__('arguments.inspect'), false)
	.option('--beautify', i18n.__('arguments.beautify'), false)
	.action(action);

program.parse();
