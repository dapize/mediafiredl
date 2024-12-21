import type { IMediaFireFile, IMediaFireFolder } from './FolderLink.d.ts';

export class FolderLink {
  private apiBaseUrl: string;
  private link: string;

  constructor(link: string) {
    this.link = link;
    this.apiBaseUrl = 'https://www.mediafire.com/api/1.4/folder/get_content.php';
  }

  public async getLinks(): Promise<string[]> {
    const folderKey = this.getFolderKey();
    const fileLinks = await this.getFilesFromFolder(folderKey);
    const folderLinks = await this.getFoldersFromFolder(folderKey);
    return [...fileLinks, ...folderLinks];
  }

  public getFolderName(): string {
    const lastPart = this.link.lastIndexOf('/');
    const rawName = decodeURIComponent(this.link.substring(lastPart + 1));
    return this.sanitizeFolderName(rawName);
  }

  private generateSearchParams(type: 'files' | 'folders', folderKey: string): URLSearchParams {
    return new URLSearchParams({
      content_type: type,
      filter: 'all',
      order_by: 'name',
      order_direction: 'asc',
      chunk: '1',
      version: '1.5',
      folder_key: folderKey,
      response_format: 'json'
    });
  }

  private getFolderKey(): string {
    const firstPart = this.link.indexOf('/folder/');
    const lastPart = this.link.indexOf('/', firstPart + 8);
    return this.link.substring(firstPart + 8, lastPart);
  }

  private sanitizeFolderName(name: string): string {
    return name.replace(/[+_]/g, ' ').trim();
  }

  private async getFilesFromFolder(folderKey: string): Promise<string[]> {
    const params = this.generateSearchParams('files', folderKey).toString();
    const response = await fetch(`${this.apiBaseUrl}?${params}`);
    const data = (await response.json()) as {
      response: { folder_content: { files: IMediaFireFile[] } };
    };

    return data.response.folder_content.files.map((file) => decodeURI(file.links.normal_download));
  }

  private async getFoldersFromFolder(folderKey: string): Promise<string[]> {
    const params = this.generateSearchParams('folders', folderKey).toString();
    const response = await fetch(`${this.apiBaseUrl}?${params}`);
    const data = (await response.json()) as {
      response: { folder_content: { folders: IMediaFireFolder[] } };
    };

    return data.response.folder_content.folders.map((folder) => `https://www.mediafire.com/folder/${folder.folderkey}/${folder.name}`);
  }
}
