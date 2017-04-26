import fs            from 'fs';
import fsExtra       from 'fs-extra';
import path          from 'path';
import readline      from 'readline';
import sinon         from 'sinon';
import Table2        from 'cli-table2';
import test          from 'ava';
import packageJson   from './stubs/package.json';
import {
  restoreStubsAndSpies,
  readFileData,
  testUsage,
  generateFolder,
  removeOutputFolders,
  createEmptyFile,
  copyFile,
  runCli
} from './es5/test/helpers';

const PACKAGE_JSON_PATH = path.resolve(process.cwd(), 'test', 'stubs', 'package.json')
let testIndex = 0;

test.before(async () => {
  await removeOutputFolders('functional');
});

test.beforeEach(t => {
  t.context.type = 'functional';
  t.context.index = testIndex++;
  process.argv = [process.argv[0], process.argv[1]];
});

test.afterEach(t => {
  restoreStubsAndSpies(t.context);
});

test.after(async () => {
  await removeOutputFolders('functional');
});

// Help usage

test('shows usage with -h flag', async t => {
  testUsage(t, await runCli(['-h']));
});

test('shows usage with --help flag', async t => {
  testUsage(t, await runCli(['--help']));
});

test('shows usage with -? option', async t => {
  testUsage(t, await runCli(['-?']));
});

test('usage has priority over other flags', async t => {
  testUsage(t, await runCli(['-h', '-c']));
});

// Version

test('shows version with -v flag', async t => {
  let result = await runCli(['-v'])
  t.regex(result.output, /^[\d]+\.[\d]+\.[\d]+/, 'should print version');
  t.is(result.code, 0, 'versions exits with code 0');
});

test('shows version with --version flag', async t => {
  let result = await runCli(['--version'])
  t.regex(result.output, /^[\d]+\.[\d]+\.[\d]+/, 'should print version');
  t.is(result.code, 0, 'versions exits with code 0');
});

test('notifies user overrides were ignored', async t => {
  const testFolderPath = await generateFolder(t);
  await copyFile(PACKAGE_JSON_PATH, path.resolve(testFolderPath, 'package.json'));

  let result = await runCli(['bar=baz'], { directory: testFolderPath });

  t.regex(result.output, /Ignoring overrides/, 'notifies user overrides were ignored');
});

test('ignores unknown options', async t => {
  let args = ['foo', 'bar'];
  const testFolderPath = await generateFolder(t);
  await copyFile(PACKAGE_JSON_PATH, path.resolve(testFolderPath, 'package.json'));

  let result = await runCli(args, { directory: testFolderPath });
  t.regex(result.output, /The following options were ignored:/, 'outputs ignored options notification');
  t.regex(result.output, new RegExp(args[0], 'gm'), `outputs ignored option ${args[0]}`);
  t.regex(result.output, new RegExp(args[1], 'gm'), `outputs ignored option ${args[1]}`);
});

// prompts

async function SetupPromptTests(t) {
  const testFolderPath = await generateFolder(t);
  const envPath = path.resolve(testFolderPath, '.env');

  await createEmptyFile(envPath);
  await copyFile(PACKAGE_JSON_PATH, path.resolve(testFolderPath, 'package.json'));
  return testFolderPath;
}

test('prompts user if a .env file exists', async t => {
  const testFolderPath = await SetupPromptTests(t);
  let result;

  result = await runCli([], { directory: testFolderPath, next: true });
  t.regex(result.message, /File Exists/, 'prompts the file exists');
});

test('prompt confirmation - writes file and creates backup', async t => {
  const testFolderPath = await SetupPromptTests(t);
  const originalEnvPath = path.resolve(testFolderPath, '.env.orig');
  let result;

  result = await runCli(['--create'], { directory: testFolderPath, next: true });
  result = await result.next('yes\n');

  t.regex(result.message, /file created at/, 'creates file');
  fs.access(originalEnvPath, fs.F_OK, err => {
    t.falsy(err, '.env.orig file exists');
  });
});

test('prompt negation - exits', async t => {
  const testFolderPath = await SetupPromptTests(t);
  let result = await runCli(['--create'], { directory: testFolderPath, next: true });
  result = await result.next('no\n');
  t.is(result.code, 1, 'exits with error');
  t.regex(result.output, /Aborted/, 'does not create file');
});
