import { MultiBar, Options, Params, Presets } from "cli-progress";
import chalk from "chalk";
import type { IPayloadFormatBar, IProgressBarConfig } from "./ProgressBar.d.ts";

export class ProgressBar {
  private details: boolean;
  public multiBar: MultiBar;

  constructor(config: IProgressBarConfig) {
    this.details = config.details || false;
    this.multiBar = new MultiBar(
      {
        hideCursor: true,
        format: this.formatBar.bind(this),
        barCompleteChar: "#",
        barIncompleteChar: "-",
        autopadding: true,
      },
      Presets.shades_classic,
    );
  }

  private formatBar(
    _options: Options,
    _params: Params,
    payload: IPayloadFormatBar,
  ) {
    if (!payload.elapsed) return "";
    const { elapsed, percentage, value, total, speed, eta, fileName } = payload;

    const formattedFileName = this.formatFileName(fileName, 30);
    const progressBar = this.generateBar(percentage, 20);

    if (this.details) {
      const timeInfo = `[Elap: ${elapsed} | ETA: ${eta}]`;
      return `${chalk.white(formattedFileName)} ${progressBar} ${
        chalk.green(
          `${percentage.toFixed(0)}%`,
        )
      } ${chalk.yellow(`(${value} / ${total})`)} ${chalk.magenta(speed)} ${
        chalk.cyanBright(timeInfo)
      }`;
    } else {
      return `${chalk.white(formattedFileName)} ${progressBar} ${
        chalk.green(
          `${percentage.toFixed(0)}%`,
        )
      } ${chalk.magenta(speed)} ${chalk.yellow(`[ETA: ${eta}]`)}`;
    }
  }

  private formatFileName(fileName: string, maxLength: number): string {
    if (fileName.length > maxLength) {
      return `${fileName.slice(0, maxLength - 1)}…`;
    }
    return fileName.padEnd(maxLength, " ");
  }

  private generateBar(percentage: number, baseColumns: number): string {
    const full = Math.round((percentage * baseColumns) / 100);
    const complete = chalk.green("#".repeat(full));
    const left = "-".repeat(baseColumns - full);
    return `[${complete}${left}]`;
  }
}
