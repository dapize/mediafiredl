import https from "node:https";
import fs from "node:fs";
import ProgressBar from "progress";

export const downloadFile = (
  url: string,
  destination: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    file.on("finish", () => {
      file.close();
      resolve();
    });

    file.on("error", (err) => {
      file.destroy();
      fs.unlink(destination, () => {});
      reject(err);
    });

    const request = https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode == 301) {
        file.destroy();
        fs.unlink(destination, () => {});
        return downloadFile(response.headers.location!, destination).then(resolve)
      }

      response.pipe(file);

      const fileLength = parseInt(response.headers["content-length"]!, 10);
      const bar = new ProgressBar(
        ":percent [:bar] :rate/bps :etas :elapsed",
        {
          complete: "█",
          incomplete: "▒",
          width: 50,
          total: fileLength,
        }
      );

      response.on("data", (chunk) => {
        bar.tick(chunk.length);
      });
    });

    request.on("error", (err) => {
      file.destroy();
      fs.unlink(destination, () => {});
      reject(err)
    });
  })
};
