import chalk from 'chalk';
import ora, { type Ora } from 'ora';

const SYM = {
  check: '✓',
  cross: '✗',
};

export function createSpinner(text: string): Ora {
  return ora({
    text: chalk.dim(text),
    indent: 2,
    color: 'green',
    spinner: 'dots',
  });
}

export function success(msg: string): void {
  console.log(chalk.green(SYM.check) + ' ' + msg);
}

export function failure(msg: string): void {
  console.log(chalk.red(SYM.cross) + ' ' + msg);
}

export function hint(msg: string): void {
  console.log(chalk.dim(msg));
}
