import { randomBytes } from 'crypto';
import { Archive, ArchiveFile, FileEntries } from './asar';
import { createNestedObject, random } from './helpers';

export type Patch = Partial<Archive> & { files?: ArchiveFile[] };

/**
 * Adds a bunch of random files with large sizes to the archive.
 *
 * This patch will result in huge files being written to disk upon extraction with `asar extract`, so use at your own risk AND responsibility!
 *
 * Defaults to `100 GB` of bloat.
 */
export function createBloatPatch(gigabytes = 10): Patch {
  const files: FileEntries = {};

  for (let i = 0; i < gigabytes; i++) {
    // generate unique but random string
    let filename = randomBytes(30).toString('hex');
    while (Object.keys(files).indexOf(filename) > -1)
      filename = randomBytes(30).toString('hex');

    files[filename] = { offset: '0', size: 1 * 1024 * 1024 * 1024 };
  }

  return {
    header: {
      files,
    },
  };
}

/**
 * Adds a bunch of fake files to the archive.
 *
 * Extraction using `asar extract` will fail as a result.
 */
export function createTrashPatch(options?: {
  /**
   * List of files to add.
   */
  filenames?: string[];

  /**
   * Optional function that modifies each filename before its written.
   *
   * Example: (filename: string) => filename + ".txt"
   */
  beforeWrite?: (fileName: string) => string;

  /**
   * Optional configuration for the fake file contents.
   */
  includeData?: {
    // Whether to use a random string for the file contents.
    generate?: boolean;
    /// The max size of the file in bytes.
    maxFileSize?: number;
  };
}): Patch {
  if (!options) options = {};
  if (!options.filenames || options?.filenames.length == 0)
    options.filenames = [
      'license',
      'production',
      'development',
      'staging',
      'secrets',
      'test/test1.js',
      'test/test2.js',
      'test/test3.js',
    ];
  if (!options.beforeWrite) options.beforeWrite = (f) => f;
  const { beforeWrite, filenames } = options;

  const files: FileEntries = {};

  const createableFiles: ArchiveFile[] = [];

  for (const filename of filenames) {
    const fileName = beforeWrite(filename);
    const size = Math.floor(random(1, Number.MAX_VALUE / 2));
    const offset = Math.floor(Math.random() * (Math.pow(2, 32) - 1));
    // Generates a file size between 100KB and 8MB (if the limits are not set).
    const fileSize = random(1e5, options.includeData?.maxFileSize || 1e6);

    // files in directpries
    // e.g. a/b/foo.txt, a\\b\\foo.txt
    let subdirs = filename.split(/[/\\]/);
    if (subdirs.length > 1) {
      subdirs = subdirs.join('_files_').split('_'); // subdirs: ['a', 'foo.txt'] -> ['a', 'files', 'foo.txt']

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parent = subdirs.shift()!; // subdirs: ['a', 'files', 'foo.txt'] -> ['files', 'foo.txt']

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = files[parent] || {};
      createNestedObject(obj, subdirs, { size, offset: offset.toString() });
      if (options.includeData?.generate) {
        createableFiles.push({
          name: fileName,
          data: randomBytes(fileSize),
          offset: offset,
        });
      }

      files[parent] = obj;
    }
    // regular file
    // e.g. foo.txt
    else {
      files[fileName] = { size, offset: offset.toString() };
      if (options.includeData?.generate) {
        createableFiles.push({
          name: fileName,
          data: randomBytes(fileSize),
          offset: offset,
        });
      }
    }
  }

  return {
    header: { files },
    files: createableFiles,
  };
}
