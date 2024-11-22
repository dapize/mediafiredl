import { Browser } from './Browser';
import { userAgent } from './userAgent';
import { parse } from 'content-disposition-attachment';

interface IGetDataLinkReturn {
  nameFile: string;
  href: string;
}

export const getDataLink = async (url: string): Promise<IGetDataLinkReturn> => {
  const response = await fetch(url, {
    method: 'HEAD',
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
    const browser = new Browser();
    const { fileName, href: hrefRaw } = await browser.getDataLink(url);
    nameFile = fileName;
    href = hrefRaw;
  }

  return {
    nameFile,
    href
  }
}

