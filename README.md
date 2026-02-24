<div align="center">
    <p>
        <h1>⬇️ Mediafire DL</h1>
    </p>
    <p>
        <a href="README.md"><img src="en_US.png" alt="English Language"/> English</a> — <a href="README-es_ES.md"><img src="es_ES.png" alt="English Language"/> Spanish</a>
    </p>
</div>

A simple but very useful terminal software to download files and folders from mediafire.com, builded with Typescript, Deno and Music, enjoying of reverse engineering.

> 🔔 Super important update 0.4.0: The way downloads are handled has been refactored to avoid potential file corruption when downloading compressed files. Update please

## 📸 Preview

![Preview!](preview.gif)

## 🔧 Installation

Is portable so just you have to go to the [Release Page](https://github.com/dapize/mediafiredl/releases) to get the correct binary. Supported operating systems are: Linux, Windows (Intel and ARM), Mac (Intel and ARM)

```bash
## Example for Linux installation
wget -c https://github.com/dapize/mediafiredl/releases/download/v0.4.0/mediafiredl_linux -O mediafiredl
chmod +x ./mediafiredl
```

## ✨ Usage

```
Usage: mediafiredl [options] [links...]

Download files and folders from Mediafire

Argumentos:
  links                         Links Links to Mediafire files or folders

Optiones:
  -V, --version                 Display version number
  -o, --output <path>           Output directory (default: current directory) (default: "./")
  -m, --max-downloads <number>  Maximum simultaneous downloads (default: "2")
  -i, --input-file <path>       Path to a text file containing Mediafire links
  -d, --details                 Enable verbose output (verbose mode) (default: false)
  --inspect                     Get detailed information about the given link without downloading the file. (default: false)
  -H, --headers-file <path>     Path to custom HTTP headers file (raw or JSON format)
  --export-default-headers <path>  Export default headers to file (default: ./headers.txt)
  -B, --buffer-size <number>    RAM buffer size for downloads (in megabytes) (default: "64")
  --beautify                    Returns beautified data to display for the 'inspect' option. (default: false)
  -h, --help                    Show help
```

**And voila!** That's all you need to use the **mediafiredl**.

## 📌 Examples

#### Download folders

![Preview!](folder.gif)

#### Download from TXT file (one link per line)

![Preview!](file.gif)

#### Download with more details

![Preview!](details.gif)

## 📦️ How to build your own MediafireDL

First, [clone the MediafireDL git repo](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository). Then, enter the mediafiredl directory, install dependencies, and run the build script:
> Obviously you need [Deno](https://deno.com/) installed in your system first.

```bash
cd mediafiredl
deno install
deno run build
```

The built version of MediafireDL will be placed in the `bin/` directory.

## 💡 Contributing

1. Fork the project.
2. Create a branch for your new feature.
3. Write the new feature.
4. Write the unit test.
5. Submit a pull request.

## 💖 Donate

If you think this software is useful and saves you a lot of work, a lot of costs and let you sleep much better, then donating a small amount would be very cool.

<a href="https://www.buymeacoffee.com/danielpz" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

## 📫 Bug Reports & Feature Requests

You can help by reporting bugs, suggesting features, reviewing feature specifications or just by sharing your opinion. Use [GitHub Issues](https://github.com/dapize/mediafiredl/issues) for all of that. All pull requests are welcome !

## 🧾 License

The code and documentation are published under the [Mit License](LICENSE).
