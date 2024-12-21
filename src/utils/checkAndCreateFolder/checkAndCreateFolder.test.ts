import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { checkAndCreateFolder } from './checkAndCreateFolder.ts';

vi.mock('fs');

describe('checkAndCreateFolder Utility Function', () => {
  const mockPath = '/fake/path/to/folder';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Should not create the folder When it already exists', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync');

    checkAndCreateFolder(mockPath);

    expect(fs.existsSync).toHaveBeenCalledWith(mockPath);
    expect(mkdirSyncSpy).not.toHaveBeenCalled();
  });

  it('Should create the folder When it does not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync');

    checkAndCreateFolder(mockPath);

    expect(fs.existsSync).toHaveBeenCalledWith(mockPath);
    expect(mkdirSyncSpy).toHaveBeenCalledWith(mockPath, { recursive: true });
  });
});
