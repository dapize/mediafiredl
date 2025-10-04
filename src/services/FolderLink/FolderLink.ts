import type { IMediaFireFile, IMediaFireFolder } from "./FolderLink.d.ts";

export class FolderLink {
  private apiBaseUrl: string;
  private link: string;

  constructor(link: string) {
    this.link = link;
    this.apiBaseUrl =
      "https://www.mediafire.com/api/1.4/folder/get_content.php";
  }

  public async getLinks(): Promise<string[]> {
    const folderKey = this.getFolderKey();
    if (!folderKey) throw new Error("Error getting the folder key");
    const fileLinks = await this.getFilesFromFolder(folderKey);
    const folderLinks = await this.getFoldersFromFolder(folderKey);
    return [...fileLinks, ...folderLinks];
  }

  public getFolderName(): string {
    const parts = this.link.split("/folder/")[1]?.split("/");
    const folderKey = this.getFolderKey();
    const folderName = parts[1]
      ? decodeURIComponent(parts[1].replace(/\+/g, " "))
      : folderKey;

    return this.sanitizeFolderName(folderName as string);
  }

  private generateSearchParams(
    type: "files" | "folders",
    folderKey: string,
  ): URLSearchParams {
    return new URLSearchParams({
      content_type: type,
      filter: "all",
      order_by: "name",
      order_direction: "asc",
      chunk: "1",
      version: "1.5",
      folder_key: folderKey,
      response_format: "json",
    });
  }

  private getFolderKey(): string | null {
    try {
      const match = this.link.match(/mediafire\.com\/folder\/([a-z0-9]+)(?:\/|$)/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  private sanitizeFolderName(name: string): string {
    return name.replace(/[+_]/g, " ").trim();
  }

  private async getFilesFromFolder(folderKey: string): Promise<string[]> {
    const params = this.generateSearchParams("files", folderKey).toString();
    const response = await fetch(`${this.apiBaseUrl}?${params}`);
    const data = (await response.json()) as {
      response: { folder_content: { files: IMediaFireFile[] } };
    };

    return data.response.folder_content.files.map((file) =>
      decodeURI(file.links.normal_download)
    );
  }

  private async getFoldersFromFolder(folderKey: string): Promise<string[]> {
    const params = this.generateSearchParams("folders", folderKey).toString();
    const response = await fetch(`${this.apiBaseUrl}?${params}`);
    const data = (await response.json()) as {
      response: { folder_content: { folders: IMediaFireFolder[] } };
    };

    return data.response.folder_content.folders.map((folder) =>
      `https://www.mediafire.com/folder/${folder.folderkey}/${folder.name}`
    );
  }
}
