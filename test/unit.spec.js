import fs            from 'fs';
import fsExtra       from 'fs-extra';
import mockFs        from 'mock-fs';
import path          from 'path';
import sinon         from 'sinon';
import test          from 'ava';
import WriteEnv      from '../dist/write-env';
import packageJson   from './stubs/package.json';
import partialJson   from './stubs/partial.json';
import emptyWriteEnv from './stubs/empty-write-env.json';
import { spawn }     from 'child_process';
import { __RewireAPI__ as WriteEnvRewire } from '../dist/write-env';
import {
  copyFile,
  createEmptyFile,
  createSpy,
  createStub,
  restoreStubsAndSpies,
  readFileData,
  testUsage,
  generateFolder,
  removeOutputFolders,
} from './es5/test/helpers';

let testIndex = 0;

// sample environment data
const STUB_DATA = {
  packageJson,
  partialJson,
  emptyJson: {},
  emptyWriteEnv,
};

test.before(async () => {
  await removeOutputFolders('unit');
});

test.beforeEach(t => {
  t.context.type = 'unit';
  t.context.index = testIndex++;
  t.context.instance = new WriteEnv();
  process.argv = [process.argv[0], process.argv[1]];
});

test.afterEach(t => {
  restoreStubsAndSpies(t.context);
});

test.after(async () => {
  await removeOutputFolders('unit');
});

test('WriteEnv constructor', t => {
  const _instance = t.context.instance;
  // options
  t.truthy(_instance.options, 'has options instance var');
  t.is(typeof _instance.options.print, 'boolean', 'print option present');
  t.falsy(_instance.options.print, 'print option initialized to false');
  t.is(typeof _instance.options.create, 'boolean', 'create option present');
  t.falsy(_instance.options.create, 'create option initialized to false');
  t.is(typeof _instance.options.showHelp, 'boolean', 'showHelp option present');
  t.falsy(_instance.options.showHelp, 'showHelp option initialized to false');
  t.truthy(_instance.options.environment, 'environment option present');
  t.is(_instance.options.environment, 'default', 'environment option initialized to \'default\'');

  // overrides
  t.truthy(_instance.overrides, 'has overrides instance var');
  t.is(_instance.overrides.length, 0, 'overrides is empty');

  // defaults
  t.truthy(_instance.defaults, 'has defaults instance var');
  t.is(_instance.defaults.length, 0, 'defaults is empty');

});

// run

test('run calls parseArgs', t => {
  createStub(t.context, 'parseArgs');
  createStub(t.context, 'getSource', STUB_DATA.packageJson);
  t.context.instance.run();
  t.is(t.context.stubs.parseArgs.callCount, 1, 'calls parseArgs once');
});

test('run calls readEnvironmentDefaults', t => {
  createStub(t.context, 'readEnvironmentDefaults');
  t.context.instance.run();
  t.is(t.context.stubs.readEnvironmentDefaults.callCount, 1, 'calls readEnvironmentDefaults once');
});

test('run calls assignOverrides', t => {
  const _instance = t.context.instance;

  createStub(t.context, 'assignOverrides');
  createStub(t.context, 'getSource', STUB_DATA.packageJson);

  _instance.options.create = true;
  _instance.overrides = [
    {
      name: 'FooBar',
      default: '1212'
    }
  ];
  _instance.run();

  t.is(t.context.stubs.assignOverrides.callCount, 1, 'calls assignOverrides once');
});

test('Calls assignOverrides when printing', t => {
  const _instance = t.context.instance;

  createStub(t.context, 'assignOverrides');
  createStub(t.context, 'getSource', STUB_DATA.packageJson);

  _instance.options.print = true;
  _instance.overrides = [
    {
      name: 'FooBar',
      default: '1212'
    }
  ];
  _instance.run();

  t.is(t.context.stubs.assignOverrides.callCount, 1, 'calls assignOverrides');
});

test('run calls writeDotEnv', t => {
  const _instance = t.context.instance;

  createStub(t.context, 'writeDotEnv');
  createStub(t.context, 'getSource', STUB_DATA.packageJson);

  _instance.options.create = true;
  _instance.run();

  t.is(t.context.stubs.writeDotEnv.callCount, 1, 'calls writeDotEnv once');
});

test('run calls printDefaults', t => {
  const _instance = t.context.instance;

  createStub(t.context, 'printDefaults');
  createStub(t.context, 'getSource', STUB_DATA.packageJson);

  _instance.options.print = true;
  _instance.run();

  t.is(t.context.stubs.printDefaults.callCount, 1, 'calls printDefaults once');
});

test('run calls showHelp', t => {
  const _instance = t.context.instance;

  createStub(t.context, 'showHelp');
  createStub(t.context, 'getSource', STUB_DATA.packageJson);

  _instance.options.showHelp = true;
  _instance.run();

  t.is(t.context.stubs.showHelp.callCount, 1, 'calls showHelp once');
});

// parseArgs

test('print option enabled with -p flag', async t => {
  process.argv.push('-p');
  t.context.instance.parseArgs();
  t.true(t.context.instance.options.print, 'print is enabled');
});

test('print option enabled with --print flag', t => {
  process.argv.push('--print');
  t.context.instance.parseArgs();
  t.true(t.context.instance.options.print, 'print is enabled');
});

test('create option enabled with -c flag', t => {
  process.argv.push('-c');
  t.context.instance.parseArgs();
  t.true(t.context.instance.options.create, 'create is enabled');
});

test('create option enabled with --create flag', t => {
  process.argv.push('--create');
  t.context.instance.parseArgs();
  t.true(t.context.instance.options.create, 'create is enabled');
});

test('write enabled with no valid arguments', t => {
  process.argv.push('foo');
  t.context.instance.parseArgs();
  t.true(t.context.instance.options.write, 'write is enabled');
});

test('showHelp option enabled with -h flag', t => {
  process.argv.push('-h');
  t.context.instance.parseArgs();
  t.true(t.context.instance.options.showHelp, 'showHelp is enabled');
});

test('showHelp option enabled with --help flag', t => {
  process.argv.push('--help');
  t.context.instance.parseArgs();
  t.true(t.context.instance.options.showHelp, 'showHelp is enabled');
});

test('showHelp option enabled with ? option', t => {
  process.argv.push('-?');
  t.context.instance.parseArgs();
  t.true(t.context.instance.options.showHelp, 'showHelp is enabled');
});

test('uses default environment', t => {
  t.context.instance.parseArgs();
  t.is(t.context.instance.options.environment, 'default', 'default environment');
});

test('changes environment with -e flag', t => {
  process.argv.push('-e=foo');
  t.context.instance.parseArgs();
  t.is(t.context.instance.options.environment, 'foo', 'changes environment');
});

test('changes environment with --environment=foo', t => {
  process.argv.push('--environment=foo');
  t.context.instance.parseArgs();
  t.is(t.context.instance.options.environment, 'foo', 'changes environment');
});

test('changes environment with --environment bar', t => {
  process.argv.push('--environment');
  process.argv.push('bar');
  t.context.instance.parseArgs();
  t.is(t.context.instance.options.environment, 'bar', 'changes environment');
});

test('parses override', t => {
  let mock = {
    key: 'aaa',
    val: 'bbb',
  };
  let ovrObj;

  process.argv.push('-c');
  process.argv.push(`${mock.key}=${mock.val}`);
  t.context.instance.parseArgs();
  console.log(t.context.instance.overrides);
  ovrObj = t.context.instance.overrides[0];

  t.is(t.context.instance.overrides.length, 1, 'override passed');
  t.is(ovrObj.name, mock.key, 'override object key parsed properly');
  t.is(ovrObj.value, mock.val, 'override object value parsed properly');
});

// readEnvironmentDefaults

test('reads from package.json of executing directory', t => {
  let jsonData = STUB_DATA.packageJson['write-env'];
  createStub(t.context, 'getSource', STUB_DATA.packageJson);

  t.context.instance.readEnvironmentDefaults();

  t.deepEqual(t.context.instance.defaults, jsonData.default, 'reads package.json for defaults');
});

test('notifies user of missing member in package.json', t => {
  createStub(t.context, 'getSource', STUB_DATA.emptyJson);

  const error = t.throws(() => t.context.instance.readEnvironmentDefaults());

  t.regex(error.message, /Missing "write-env" member of source file/, 'notifies of missing member');
});

test('notifies user missing default environment member of write-env in package.json', t => {
  createStub(t.context, 'getSource', STUB_DATA.emptyWriteEnv);

  const error = t.throws(() => t.context.instance.readEnvironmentDefaults());

  t.regex(error.message, /Missing "default" member of "write-env" in source file/, 'notifies of missing member');
});

test('notifies user missing custom environment member of write-env in package.json', t => {
  const _instance = t.context.instance;
  createStub(t.context, 'getSource', STUB_DATA.emptyWriteEnv);
  _instance.options.environment = 'foo';
  const error = t.throws(() => _instance.readEnvironmentDefaults());

  t.regex(error.message, /Missing "foo" member of "write-env" in source file/, 'notifies of missing member');
});

test('does not throw error for missing package.json when showHelp is enabled', t => {
  createStub(t.context, 'getSource', STUB_DATA.emptyJson);
  t.context.instance.options = {
    showHelp: true,
  };
  t.notThrows(() => t.context.instance.readEnvironmentDefaults());
});

// assignOverrides

function setupOverrides(instance, overrides) {
  const _instance = instance;
  _instance.options = { create: true };
  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.packageJson['write-env'].default));
  _instance.overrides = overrides;
};

test('overrides existing variables', t => {
  let _instance = t.context.instance;
  let index = 0;
  let varName = STUB_DATA.packageJson['write-env'].default[index].name;
  let originalValue = STUB_DATA.packageJson['write-env'].default[index].default;
  let newValue = 'aaa';
  let override = [{
    name: varName,
    value: newValue
  }];
  let envVar;

  setupOverrides(_instance, override);
  _instance.assignOverrides();

  envVar = _instance.defaults[index];

  t.is(envVar.name, varName, 'variable name matches existing');
  t.is(envVar.default, newValue, 'variable value is override value');
  t.not(envVar.default, originalValue, 'variable value is not original value');
});

test('adds new variables', t => {
  let _instance = t.context.instance;
  const name = 'abc';
  const value = 'bbb';
  const override = [{
    name,
    value
  }];
  let hasEnvVar;

  setupOverrides(_instance, override);
  _instance.assignOverrides();

  hasEnvVar = _instance.defaults.find(val => val.name === name && val.default === value);

  t.truthy(hasEnvVar, 'defaults contains new variables');
});

test('overrides existing and adds new variables', t => {
  let _instance = t.context.instance;
  let index = 0;
  const varName = STUB_DATA.packageJson['write-env'].default[index].name;
  const originalValue = STUB_DATA.packageJson['write-env'].default[index].default;
  const newValue = 'zzzz';
  const fakeDataValue = 'test';
  const overrides = [
    {
      name: varName,
      value: newValue
    },
    {
      name: fakeDataValue.toUpperCase(),
      value: fakeDataValue
    }
  ];
  let overriddenVar, newVar;

  setupOverrides(_instance, overrides);
  _instance.assignOverrides();

  newVar = _instance.defaults.find(val => val.name === fakeDataValue.toUpperCase() && val.default === fakeDataValue);
  overriddenVar = _instance.defaults[index];

  t.truthy(newVar, 'new variable is in list of defaults');

  t.is(overriddenVar.name, varName, 'overridden variable name matches existing');
  t.is(overriddenVar.default, newValue, 'overridden variable value is override value');
  t.not(overriddenVar.default, originalValue, 'overridden variable value is not original value');
});

// writeDotEnv

function setupWriteDotEnvStubs(context) {
  createStub(context, 'parseArgs');
  createStub(context, 'writeStream', { catch: () => 'err' });
  createStub(context, 'promptUser', {});
}

test('determines proper filename', t => {
  let _instance = t.context.instance;
  let arg;
  const fsAccessStub = sinon.stub(fs, 'access');
  fsAccessStub.yields(true);
  setupWriteDotEnvStubs(t.context);

  _instance.options.environment = 'default';
  _instance.writeDotEnv();

  arg = t.context.stubs.writeStream.args[0][0];
  t.is(arg.substr(-4), '.env', 'default env file');

  _instance.options.environment = 'dev';
  _instance.writeDotEnv();

  arg = t.context.stubs.writeStream.args[1][0]
  t.is(arg.substr(-8), '.env.dev', 'custom env file');

  fsAccessStub.restore();
});

test('writes if file doesn\'t exist', t => {
  let _instance = t.context.instance;
  const fsAccessStub = sinon.stub(fs, 'access');
  fsAccessStub.yields(true);
  setupWriteDotEnvStubs(t.context);

  _instance.writeDotEnv();

  t.is(t.context.stubs.writeStream.callCount, 1, 'writeStream called');

  fsAccessStub.restore();
});

test('prompts user if file exists', t => {
  let _instance = t.context.instance;
  const fsAccessStub = sinon.stub(fs, 'access');
  fsAccessStub.yields(false);
  setupWriteDotEnvStubs(t.context);

  _instance.writeDotEnv();

  t.is(t.context.stubs.promptUser.callCount, 1, 'promptUser called');
  fsAccessStub.restore();
});

// writeStream

test('writes .env file', async t => {
  const _instance = t.context.instance;
  const writePath = path.resolve(await generateFolder(t), '.env');
  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.packageJson['write-env'].default));
  createSpy(t.context, 'log');

  await _instance.writeStream(writePath);
  t.regex(t.context.spies.log.args[0][0], /file created at/, 'should print path to file');

  fs.access(writePath, fs.F_OK, err => {
    t.falsy(err, 'file exists');
  });
});

test('has valid data', async t => {
  const _instance = t.context.instance;
  const envPath = path.resolve(await generateFolder(t), '.env');
  let result;
  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.packageJson['write-env'].default));

  await _instance.writeStream(envPath);
  result = await readFileData(_instance, envPath);
  t.regex(`${result.instanceData.name}=${result.instanceData.default}`, new RegExp(result.envData), 'var=value pattern matched.');
});

test('has valid overwritten data', async t => {
  const _instance = t.context.instance;
  const envPath = path.resolve(await generateFolder(t), '.env');
  const index = 0;
  const varName = STUB_DATA.packageJson['write-env'].default[index].name;
  const originalValue = STUB_DATA.packageJson['write-env'].default[index].default;
  const newValue = 'zzzz';
  let result;

  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.packageJson['write-env'].default));
  _instance.assignOverrides({
    name: varName,
    value: newValue
  });

  await _instance.writeStream(envPath);
  result = await readFileData(_instance, envPath);
  t.regex(`${result.instanceData.name}=${result.instanceData.default}`, new RegExp(result.envData), 'var=value pattern matched.');
});

test('has valid new data as override', async t => {
  const _instance = t.context.instance;
  const outputPath = await generateFolder(t);
  const envPath = path.resolve(outputPath, '.env');
  const name = 'abc';
  const value = 'bbb';
  const override = {
    name,
    value
  };
  let result;

  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.packageJson['write-env'].default));
  _instance.overrides = [override];
  _instance.assignOverrides();

  await _instance.writeStream(envPath);
  result = await readFileData(_instance, envPath);
  t.regex(`${result.instanceData.name}=${result.instanceData.default}`, new RegExp(result.envData), 'var=value pattern matched.');
});

test('writes file with environment appended', async t => {
  const _instance = t.context.instance;
  const environ = 'foo';
  const outputPath = await generateFolder(t);
  const envPath = path.resolve(outputPath, '.env' + environ);

  createSpy(t.context, 'log');
  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.packageJson['write-env'].dev));
  await _instance.writeStream(envPath);
  await readFileData(_instance, envPath);

  t.regex(t.context.spies.log.args[0][0], new RegExp(envPath), 'should print path to file');
});

test('writes file with environment data', async t => {
  const _instance = t.context.instance;
  const environ = 'dev';
  const writePath = path.resolve(await generateFolder(t), '.env.' + environ);
  let result;

  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.packageJson['write-env'].dev));

  await _instance.writeStream(writePath);
  result = await readFileData(_instance, writePath, 0);
  t.regex(`${result.instanceData.name}=${result.instanceData.default}`, new RegExp(result.envData), 'var=value pattern matched.');
});

test('exits on error', async t => {
  const _instance = t.context.instance;
  const envPath = path.resolve('fake', '.env');

  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.packageJson['write-env'].default));
  await _instance.writeStream(envPath).catch(error => {
    t.regex(error.message, new RegExp(`Error writing to ${envPath}`), 'should print path to file');
  });

  fs.access(envPath, fs.F_OK, err => {
    t.truthy(err, 'file does not exists');
  });
});

// promptUser

test('does not prompt user if options.force is true', async t => {
  const _instance = t.context.instance;
  const outputPath = await generateFolder(t);
  const envPath = path.resolve(outputPath, '.env');

  _instance.options.force = true;
  fs.appendFileSync(envPath, '');

  await t.notThrows(_instance.promptUser(envPath));
});

test('prompt exits on error', async t => {
  const _instance = t.context.instance;

  WriteEnv.__Rewire__('prompt', {
    start: () => {
      return {};
    },
    get: (schema, done) => {
      done(true, null);
    }
  });
  await _instance.promptUser().catch(err => {
    t.regex(err.message, /Error Overwriting File/, 'Errors are handled');
  });

  WriteEnv.__ResetDependency__('prompt');
});


// printDefaults

function rewireTable(result = {}) {
  return () => {
    return {
      push: (arr) => {
        result.values.push(arr);
      },

      toString: () => {
        result.values.forEach(row => {
          result.output += `${row.join(' : ')}\n`;
        });
        return '';
      }
    }
  }
}

test('outputs correct default data', async t => {
  const _instance = t.context.instance;
  let result = { values: [], output: '' };

  WriteEnvRewire.__Rewire__('Table', rewireTable(result));

  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.packageJson['write-env'].default));
  _instance.printDefaults();

  STUB_DATA
    .packageJson['write-env']
    .default
    .forEach(env => {
      t.regex(result.output, new RegExp(env.name), `outputs name: ${env.name}`);
      t.regex(result.output, new RegExp(env.description), `outputs description: ${env.description}`);
      t.regex(result.output, new RegExp(env.default), `outputs default: ${env.default}`);
      t.regex(result.output, new RegExp(env.required.toString()), `outputs required: ${env.required}`);
    });
});

test('defaults to \'\' for Description', t => {
  const _instance = t.context.instance;
  let result = { values: [], output: '' };

  WriteEnv.__Rewire__('Table', rewireTable(result));

  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.partialJson['write-env'].default));
  _instance.printDefaults();

  t.is(result.values[0][1], '', 'description is an empty string');
});

test('defaults to \'\' for Default', t => {
  const _instance = t.context.instance;
  let result = { values: [], output: '' };

  WriteEnvRewire.__Rewire__('Table', rewireTable(result));

  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.partialJson['write-env'].default));
  _instance.printDefaults();

  t.is(result.values[0][2], '', 'default is an empty string');
});

test('outputs false for required', t => {
  const _instance = t.context.instance;
  let result = { values: [], output: '' };

  WriteEnvRewire.__Rewire__('Table', rewireTable(result));

  _instance.defaults = JSON.parse(JSON.stringify(STUB_DATA.partialJson['write-env'].default));
  _instance.printDefaults();

  t.falsy(result.values[0][2], 'required is false');
});
