export interface File {
  /**
   * Size in bytes.
   */
  size: number;

  /**
   * Offset that specifies where the stored file bytes begin in the archive.
   */
  offset: string;
}

export interface FileEntries {
  [filename: string]: File | Header;
}

export interface Header {
  files: FileEntries;
}

export interface ArchiveFile {
  name: string;
  data: Buffer;
  offset: number;
}

export interface Archive {
  /**
   * Length of the header.
   */
  headerSize: number;

  /**
   * The header stores information about the files that are stored in the archive.
   */
  header: Header;
}
