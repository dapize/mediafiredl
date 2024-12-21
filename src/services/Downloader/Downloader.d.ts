import { SingleBar } from 'cli-progress';
import type { ILinkDetails } from '../FileLink/index.ts';

export interface IDownloaderConfig {
  concurrencyLimit: number;
  details?: boolean;
  inspect?: boolean;
  beautify?: boolean;
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

export interface IWriteDiskArgs {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  filePath: string;
  progressBar: SingleBar;
}

export interface ILinkQueue {
  link: string;
  output: string;
}

export interface IMetadata extends ILinkDetails {
  link: string;
}
