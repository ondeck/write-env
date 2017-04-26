import fs from 'fs';
import fsExtra from 'fs-extra';
import path  from 'path';
import sinon from 'sinon';
import { spawn } from 'child_process';

const NODE = path.resolve(process.cwd(), 'node_modules/.bin/babel-node');
const CLI = require.resolve('../../../lib/_write-env-cli.js');

export function createSpy(context, name) {
  let _instance = context.instance || context;
  context.spies = context.spies || {};
  context.spies[name] = sinon.spy(_instance, name);
}

export function createStub(context, name, returnValue) {
  let _instance = context.instance || context;
  context.stubs = context.stubs || {};
  context.stubs[name] = sinon.stub(_instance, name);
  context.stubs[name].returns(returnValue);
}

export function restoreStubsAndSpies(context) {
  restoreSpies(context.spies);
  restoreSpies(context.stubs);
}

function restoreSpies(spies) {
  for (let spy in spies) {
    if (!spies.hasOwnProperty(spy)) return;
    if (typeof spies[spy].restore === 'function') {
      spies[spy].restore();
    }
  }
}

export function readFileData(instance, path, index = 1) {
  const readStream = fs.createReadStream(path);
  let streamData = '';
  return new Promise((resolve, reject) => {
    readStream
      .on('data', chunk => {
        streamData += chunk;
      })
      .on('error', reject)
      .on('end', () => {
        const instanceData = instance.defaults[index];
        const envData = streamData.split('\n')[index];
        resolve({ instanceData, envData });
      });
  });
}

export function testUsage(t, result) {
  t.regex(result.output, /Usage:\r?\n/, 'should print usage');
  t.is(result.code, 0, 'help exits with code 0');
};

export function generateFolder(t) {
  return new Promise((resolve, reject) => {
    const rootPath = path.resolve(process.cwd(), 'test', 'output', t.context.type || '');
    const index = t.context.index;
    const folderPath = path.resolve(rootPath, `test${index}`);
    fsExtra.ensureDir(folderPath, err => {
      if (err) reject(err);
      resolve(folderPath);
    });
  });
}

export function removeOutputFolders(type) {
  return new Promise((resolve, reject) => {
    fsExtra.emptyDir(path.resolve(process.cwd(), 'test', 'output', type || ''), err => {
      if (err) reject(err);
      resolve();
    });
  });
}

export function createEmptyFile(filePath) {
  return new Promise((resolve, reject) => {
    fsExtra.ensureFile(filePath, err => {
      if (err) reject(err);
      resolve();
    });
  });
}

export function copyFile(filePath, destinationPath) {
  return new Promise((resolve, reject) => {
    fsExtra.copy(filePath, destinationPath, err => {
      if (err) reject(err);
      resolve();
    });
  });
}

export function runCli(args = [], options = {}) {
  const _args = ['--', CLI, ...args];
  let childOptions = {};
  let output = '';
  if (options.directory) childOptions.cwd = options.directory;
  const child = spawn(NODE, _args, childOptions);

  function promise(resolve, reject) {
    child.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      if (options.next) resolve({
        next: (writeMessage) => {
          if (writeMessage) {
            process.nextTick(() => child.stdin.write(writeMessage));
          }
          return new Promise(promise);
        },
        message,
        child
      });
    });

    child.on('close', code => {
      resolve({ output, code, child });
    });

    child.stderr.on('data', (response) => {
      resolve({ output: response.toString(), code: 1, child });
    });
  }

  return new Promise(promise);
}
