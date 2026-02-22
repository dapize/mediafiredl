import Events from "node:events";
import fs from "node:fs";
import path from "node:path";

import chalk from "chalk";

import { i18n } from "@i18n/i18n.ts";
import { FileLink, type ILinkDetails } from "@services/FileLink/index.ts";
import { FolderLink } from "@services/FolderLink/index.ts";

import { ProgressBar } from "@helpers/ProgressBar/index.ts";

import { checkAndCreateFolder } from "@utils/checkAndCreateFolder/index.ts";
import { convertMsToTime } from "@utils/convertMsToTime/index.ts";
import { formatBytes } from "@utils/formatBytes/index.ts";
import { downloadHeaders, type IHeaders } from "@utils/headers/index.ts";

import type { IDownloaderConfig, ILinkQueue, IMetadata, IWriteDiskArgs } from "./Downloader.d.ts";

export class Downloader extends Events {
	private concurrencyLimit: number;
	private progressBar: ProgressBar;
	private linkQueue: Set<ILinkQueue>;
	private linksProcessing: Set<Promise<void>>;
	private invalidLinks: Set<string>;
	private downloadedFiles: number;
	private inspect: boolean;
	private beautify: boolean;
	private currentHeaders: IHeaders;

	constructor(config: IDownloaderConfig) {
		super();
		this.concurrencyLimit = config.concurrencyLimit;
		this.progressBar = new ProgressBar({ details: config.details });
		this.beautify = config.beautify || false;
		this.inspect = config.inspect || false;
		this.linkQueue = new Set();
		this.linksProcessing = new Set();
		this.invalidLinks = new Set();
		this.downloadedFiles = 0;
		this.currentHeaders = downloadHeaders;
	}

	public setCustomHeaders(headers: IHeaders): void {
		this.currentHeaders = headers;
	}

	public addLinks(links: string[], output: string) {
		links.forEach((link) => {
			this.linkQueue.add({ link, output });
		});
	}

	public startProcessing() {
		while (this.checkIfContinueDownloading()) {
			this.processLinks();
		}
	}

	private checkIfContinueDownloading(): boolean {
		return Boolean(this.linkQueue.size && this.linksProcessing.size < this.concurrencyLimit);
	}

	private processLinks() {
		const [firstLink] = this.linkQueue;
		this.linkQueue.delete(firstLink);
		const { link, output } = firstLink;

		const linkProcessor = link.includes("/folder/") ? this.extractFolderLinks : this.processFileLink;
		const processorPromise = linkProcessor.call(this, link, output);

		this.linksProcessing.add(processorPromise);
		processorPromise.finally(() => {
			this.linksProcessing.delete(processorPromise);
			if (this.checkIfContinueDownloading()) {
				this.startProcessing();
				return;
			}
			this.checkToCompleted();
		});
	}

	private async processFileLink(link: string, output: string): Promise<void> {
		const linkMetadata = await this.getMetadata(link);
		if (!linkMetadata) {
			// deno-lint-ignore ban-untagged-todo
			Promise.resolve(); // TODO extends this part in the new version
			return;
		}

		if (this.inspect) {
			return this.showMetadata({ ...linkMetadata, link });
		}

		await this.downloadFileLink(linkMetadata, output);
	}

	private showMetadata({ link, url, fileName, size }: IMetadata) {
		if (this.beautify) {
			return console.log(
				`${chalk.magenta(`${i18n.__("metadata.link")}:`)} ${link}\n` +
					`${chalk.cyanBright(`${i18n.__("metadata.directLink")}:`)} ${url}\n` +
					`${chalk.greenBright(`${i18n.__("metadata.fileName")}:`)} ${fileName}\n` +
					`${chalk.blue(`${i18n.__("metadata.size")}:`)} ${formatBytes(size)}\n`,
			);
		}
		const jsonFormat = {
			link,
			directLink: url,
			fileName: fileName,
			size: size,
		};
		console.log(JSON.stringify(jsonFormat));
	}

	private async getMetadata(link: string): Promise<ILinkDetails | null> {
		const fileLink = new FileLink(link);
		const isAvailable = await fileLink.isAvailable();
		if (!isAvailable) {
			this.invalidLinks.add(link);
			return null;
		}
		return await fileLink.getDetails();
	}

	private async downloadFileLink({ url, fileName, size }: ILinkDetails, output: string): Promise<void> {
		const response = await fetch(url, {
			headers: this.currentHeaders,
		});
		if (!response.ok) {
			throw new Error(
				i18n.__("errors.failedDownload", {
					fileName,
					responseStatus: response.status,
					responseStatusText: response.statusText,
				}),
			);
		}
		if (!response.body) {
			throw new Error(i18n.__("errors.emptyResponse", { name: fileName, link: url }));
		}
		const reader = response.body.getReader();
		const absolutePath = path.resolve(output);
		checkAndCreateFolder(absolutePath);
		const filePath = path.join(absolutePath, fileName);
		const progressBar = this.newProgressBar(fileName, size);

		await this.writeToDisk({
			reader,
			filePath,
			progressBar,
		});

		this.downloadedFiles += 1;

		progressBar.instance.stop();
	}

	private async extractFolderLinks(link: string, output: string): Promise<void> {
		const folderLink = new FolderLink(link);
		const links = await folderLink.getLinks();
		const folderName = folderLink.getFolderName();
		const finalPath = path.resolve(output, folderName);
		this.addLinks(links, finalPath);
	}

	private checkToCompleted() {
		const returnData = {
			downloadedFiles: this.downloadedFiles,
			invalidLinks: this.invalidLinks,
		};
		if (!this.linksProcessing.size) {
			this.emit("completed", returnData);
			return;
		}
		Promise.all(this.linksProcessing).finally(() => {
			setTimeout(() => {
				this.emit("completed", returnData);
			}, 1000);
		});
	}

	private async writeToDisk({ reader, filePath, progressBar }: IWriteDiskArgs): Promise<void> {
		const fileStream = fs.createWriteStream(filePath);
		fileStream.on("error", (streamError) => {
			throw new Error(i18n.__("errors.writeFile", { message: streamError.message }));
		});

		let downloaded = 0;

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value) {
					downloaded += value.length;
					progressBar.update(downloaded);
					fileStream.write(value);
				}
			}
			progressBar.completed();
		} catch (error) {
			if (!fileStream.closed) fileStream.close();
			if (fs.existsSync(filePath)) {
				try {
					fs.unlinkSync(filePath);
				} catch (_err) {
					console.warn(i18n.__("warnings.deletePartial", { filePath }));
				}
			}
			throw error;
		} finally {
			if (!fileStream.closed && !fileStream.destroyed) {
				fileStream.end();
			}
		}
	}

	private newProgressBar(fileName: string, totalSize: number) {
		const startTime = performance.now();
		const progressBar = this.progressBar.multiBar.create(100, 0);
		progressBar.setTotal(totalSize);
		const totalSizeFormatted = formatBytes(totalSize);

		return {
			update: (downloaded: number) => {
				const elapsedTime = performance.now() - startTime;
				const elapsedFormated = convertMsToTime(elapsedTime);
				const speed = downloaded / (elapsedTime / 1000);
				const eta = (totalSize - downloaded) / (speed || 1);
				const etaFormated = convertMsToTime(eta * 1000) || "--:--";
				const downloadedInMiB = (downloaded / 1024 / 1024).toFixed(2);
				const percentage = totalSize > 0 ? (downloaded / totalSize) * 100 : 0;

				progressBar.update(Number(downloadedInMiB), {
					elapsed: elapsedFormated,
					percentage,
					value: formatBytes(downloaded),
					total: totalSizeFormatted,
					speed: `[${formatBytes(speed)}/s]`,
					eta: etaFormated,
					fileName,
				});
			},
			instance: progressBar,
			completed() {
				this.update(totalSize);
			},
		};
	}
}
