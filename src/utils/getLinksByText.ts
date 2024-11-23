import { promises as fs } from 'node:fs';

export const getLinksByText = async (path: string): Promise<string[]> => {
  const textFile = await fs.readFile(path, 'utf-8');
  return textFile.split('\n').filter((line) => line.trim());
};
