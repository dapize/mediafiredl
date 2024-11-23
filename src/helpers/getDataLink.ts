import * as cheerio from "cheerio";
import { parse } from 'content-disposition-attachment';
import { userAgent } from "../utils/userAgent.ts";

interface IGetDataLinkReturn {
  nameFile: string;
  href: string;
}

export const getDataLink = async (url: string): Promise<IGetDataLinkReturn> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': userAgent
    }
  });
  if (response.status >= 400) {
    throw new Error(`Link not accessible!: Status code: ${response.status}`);
  };
  const contentType = response.headers.get('Content-Type');
  let nameFile = '';
  let href = '';
  const isDirectLink = !contentType?.includes('text/html');
  if (isDirectLink) {
    href = url;
    const contentDisposition = response.headers.get('Content-Disposition') as string;
    if (contentDisposition) {
      const { filename } = parse(contentDisposition) as {
        attachment: true;
        filename?: string;
      };
      if (filename) {
        nameFile = filename
      }
    }
  } else {
    const html = await response.text();
    const $ = cheerio.load(html);
    nameFile = $(".dl-btn-label").attr('title') as string;
    href = $('#downloadButton').attr('href') as string;
  }

  return {
    nameFile,
    href
  }
}

