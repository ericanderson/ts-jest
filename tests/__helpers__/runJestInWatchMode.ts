// from: https://github.com/facebook/jest/blob/master/integration_tests/runJest.js
import { ChildProcess, SpawnOptions } from 'child_process';
import { fileExists } from './utils';
const path = require('path');
const spawn: (command: string, args?: string[], options?: SpawnOptions) => ChildProcess = (process.platform === 'win32')
  ? require('cross-spawn-with-kill')
  : require('cross-spawn');

// assuming that jest is installed globally
// using `npm i -g jest-cli`
const JEST_PATH = 'jest';

// return the result of the spawned proccess:
//  [ 'status', 'signal', 'output', 'pid', 'stdout', 'stderr',
//    'envPairs', 'options', 'args', 'file' ]
export default function runJestInWatchMode(dir, args?: any[]) {
  const isRelative = dir[0] !== '/';

  if (isRelative) {
    dir = path.resolve(__dirname, dir);
  }

  const localPackageJson = path.resolve(dir, 'package.json');
  if (!fileExists(localPackageJson)) {
    throw new Error(`
      Make sure you have a local package.json file at
        "${localPackageJson}".
      Otherwise Jest will try to traverse the directory tree and find the
      the global package.json, which will send Jest into infinite loop.
    `);
  }
  args = (args !== undefined) ? args : [];
  args.push('--watchAll');

  const childProcess = spawn(JEST_PATH, args, {
    cwd: dir,
  });
  let getStderrAsync = () => {
    return new Promise((resolve: (value: string) => void) => {
      let stderr = '';
      let listener = (data) => {
        stderr += data.toString();
        console.log(data.toString());
        if (data.toString().includes('Ran all')) {
          resolve(stderr);
          childProcess.stderr.removeListener('data', listener);
        }
      };
      childProcess.stderr.on('data', listener);
    });
  };

  return { childProcess, getStderrAsync };
}