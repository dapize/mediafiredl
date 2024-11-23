export const help = `
usage: mediafiredl [-h] [-v] [-o OUTPUT] [-i TEXTFILE] url

positional arguments:
  url             url or file/folder

options:
  -h, --help            show this help message and exit
  -v, --version         display version (default: None)
  -o OUTPUT, --output OUTPUT
                        output file name/path
  --output-dir          output folder to save the files downloaded (default: ./)
  -i, --input-file      define the txt files containing a list of links, one per line.
`;
