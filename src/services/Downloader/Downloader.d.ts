import type { SingleBar } from 'cli-progress';

import type { ILinkDetails } from '@services/FileLink/index.ts';

export interface IDownloaderConfig {
	concurrencyLimit: number;
	details?: boolean;
	inspect?: boolean;
	beautify?: boolean;
	bufferSize: number;
}

export interface IPayloadFormatBar {
	fileName: string;
	elapsed: string;
	percentage: number;
	value: string;
	total: string;
	speed: string;
	eta: string;
}

export interface ICustomSingleBar {
	completed: () => void;
	update: (downloader: number) => void;
	instance: SingleBar;
}

export interface IWriteDiskArgs {
	responseBody: ReadableStream<Uint8Array<ArrayBuffer>>;
	filePath: string;
	progressBar: ICustomSingleBar;
}

export interface ILinkQueue {
	link: string;
	output: string;
}

export interface IMetadata extends ILinkDetails {
	link: string;
}
