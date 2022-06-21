export interface File {
  kind: string;

  /**
   * Size in bytes.
   */
  size: number;

  /**
   * Offset that specifies where the stored file bytes begin in the archive.
   */
  offset: string;

  /**
   * Data to be stored in the archive.
   */
  data?: Buffer;
}

export interface FileEntries {
  [filename: string]: File | Header;
}

export interface Header {
  kind: string;
  files: FileEntries;
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
