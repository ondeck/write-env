'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.__RewireAPI__ = exports.__ResetDependency__ = exports.__set__ = exports.__Rewire__ = exports.__GetDependency__ = exports.__get__ = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.createSpy = createSpy;
exports.createStub = createStub;
exports.restoreStubsAndSpies = restoreStubsAndSpies;
exports.readFileData = readFileData;
exports.testUsage = testUsage;
exports.generateFolder = generateFolder;
exports.removeOutputFolders = removeOutputFolders;
exports.createEmptyFile = createEmptyFile;
exports.copyFile = copyFile;
exports.runCli = runCli;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var NODE = _get__('path').resolve(process.cwd(), 'node_modules/.bin/babel-node');
var CLI = require.resolve('../../../lib/_write-env-cli.js');

function createSpy(context, name) {
  var _instance = context.instance || context;
  context.spies = context.spies || {};
  context.spies[name] = _get__('sinon').spy(_instance, name);
}

function createStub(context, name, returnValue) {
  var _instance = context.instance || context;
  context.stubs = context.stubs || {};
  context.stubs[name] = _get__('sinon').stub(_instance, name);
  context.stubs[name].returns(returnValue);
}

function restoreStubsAndSpies(context) {
  _get__('restoreSpies')(context.spies);
  _get__('restoreSpies')(context.stubs);
}

function restoreSpies(spies) {
  for (var spy in spies) {
    if (!spies.hasOwnProperty(spy)) return;
    if (typeof spies[spy].restore === 'function') {
      spies[spy].restore();
    }
  }
}

function readFileData(instance, path) {
  var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

  var readStream = _get__('fs').createReadStream(path);
  var streamData = '';
  return new Promise(function (resolve, reject) {
    readStream.on('data', function (chunk) {
      streamData += chunk;
    }).on('error', reject).on('end', function () {
      var instanceData = instance.defaults[index];
      var envData = streamData.split('\n')[index];
      resolve({ instanceData: instanceData, envData: envData });
    });
  });
}

function testUsage(t, result) {
  t.regex(result.output, /Usage:\r?\n/, 'should print usage');
  t.is(result.code, 0, 'help exits with code 0');
};

function generateFolder(t) {
  return new Promise(function (resolve, reject) {
    var rootPath = _get__('path').resolve(process.cwd(), 'test', 'output', t.context.type || '');
    var index = t.context.index;
    var folderPath = _get__('path').resolve(rootPath, 'test' + index);
    _get__('fsExtra').ensureDir(folderPath, function (err) {
      if (err) reject(err);
      resolve(folderPath);
    });
  });
}

function removeOutputFolders(type) {
  return new Promise(function (resolve, reject) {
    _get__('fsExtra').emptyDir(_get__('path').resolve(process.cwd(), 'test', 'output', type || ''), function (err) {
      if (err) reject(err);
      resolve();
    });
  });
}

function createEmptyFile(filePath) {
  return new Promise(function (resolve, reject) {
    _get__('fsExtra').ensureFile(filePath, function (err) {
      if (err) reject(err);
      resolve();
    });
  });
}

function copyFile(filePath, destinationPath) {
  return new Promise(function (resolve, reject) {
    _get__('fsExtra').copy(filePath, destinationPath, function (err) {
      if (err) reject(err);
      resolve();
    });
  });
}

function runCli() {
  var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var _args = ['--', _get__('CLI')].concat(_toConsumableArray(args));
  var childOptions = {};
  var output = '';
  if (options.directory) childOptions.cwd = options.directory;
  var child = _get__('spawn')(_get__('NODE'), _args, childOptions);

  function promise(resolve, reject) {
    child.stdout.on('data', function (data) {
      var message = data.toString();
      output += message;
      if (options.next) resolve({
        next: function next(writeMessage) {
          if (writeMessage) {
            process.nextTick(function () {
              return child.stdin.write(writeMessage);
            });
          }
          return new Promise(promise);
        },
        message: message,
        child: child
      });
    });

    child.on('close', function (code) {
      resolve({ output: output, code: code, child: child });
    });

    child.stderr.on('data', function (response) {
      resolve({ output: response.toString(), code: 1, child: child });
    });
  }

  return new Promise(promise);
}

function _getGlobalObject() {
  try {
    if (!!global) {
      return global;
    }
  } catch (e) {
    try {
      if (!!window) {
        return window;
      }
    } catch (e) {
      return this;
    }
  }
}

;
var _RewireModuleId__ = null;

function _getRewireModuleId__() {
  if (_RewireModuleId__ === null) {
    var globalVariable = _getGlobalObject();

    if (!globalVariable.__$$GLOBAL_REWIRE_NEXT_MODULE_ID__) {
      globalVariable.__$$GLOBAL_REWIRE_NEXT_MODULE_ID__ = 0;
    }

    _RewireModuleId__ = __$$GLOBAL_REWIRE_NEXT_MODULE_ID__++;
  }

  return _RewireModuleId__;
}

function _getRewireRegistry__() {
  var theGlobalVariable = _getGlobalObject();

  if (!theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__) {
    theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__ = Object.create(null);
  }

  return __$$GLOBAL_REWIRE_REGISTRY__;
}

function _getRewiredData__() {
  var moduleId = _getRewireModuleId__();

  var registry = _getRewireRegistry__();

  var rewireData = registry[moduleId];

  if (!rewireData) {
    registry[moduleId] = Object.create(null);
    rewireData = registry[moduleId];
  }

  return rewireData;
}

(function registerResetAll() {
  var theGlobalVariable = _getGlobalObject();

  if (!theGlobalVariable['__rewire_reset_all__']) {
    theGlobalVariable['__rewire_reset_all__'] = function () {
      theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__ = Object.create(null);
    };
  }
})();

var INTENTIONAL_UNDEFINED = '__INTENTIONAL_UNDEFINED__';
var _RewireAPI__ = {};

(function () {
  function addPropertyToAPIObject(name, value) {
    Object.defineProperty(_RewireAPI__, name, {
      value: value,
      enumerable: false,
      configurable: true
    });
  }

  addPropertyToAPIObject('__get__', _get__);
  addPropertyToAPIObject('__GetDependency__', _get__);
  addPropertyToAPIObject('__Rewire__', _set__);
  addPropertyToAPIObject('__set__', _set__);
  addPropertyToAPIObject('__reset__', _reset__);
  addPropertyToAPIObject('__ResetDependency__', _reset__);
  addPropertyToAPIObject('__with__', _with__);
})();

function _get__(variableName) {
  var rewireData = _getRewiredData__();

  if (rewireData[variableName] === undefined) {
    return _get_original__(variableName);
  } else {
    var value = rewireData[variableName];

    if (value === INTENTIONAL_UNDEFINED) {
      return undefined;
    } else {
      return value;
    }
  }
}

function _get_original__(variableName) {
  switch (variableName) {
    case 'path':
      return _path2.default;

    case 'sinon':
      return _sinon2.default;

    case 'restoreSpies':
      return restoreSpies;

    case 'fs':
      return _fs2.default;

    case 'fsExtra':
      return _fsExtra2.default;

    case 'CLI':
      return CLI;

    case 'spawn':
      return _child_process.spawn;

    case 'NODE':
      return NODE;
  }

  return undefined;
}

function _assign__(variableName, value) {
  var rewireData = _getRewiredData__();

  if (rewireData[variableName] === undefined) {
    return _set_original__(variableName, value);
  } else {
    return rewireData[variableName] = value;
  }
}

function _set_original__(variableName, _value) {
  switch (variableName) {}

  return undefined;
}

function _update_operation__(operation, variableName, prefix) {
  var oldValue = _get__(variableName);

  var newValue = operation === '++' ? oldValue + 1 : oldValue - 1;

  _assign__(variableName, newValue);

  return prefix ? newValue : oldValue;
}

function _set__(variableName, value) {
  var rewireData = _getRewiredData__();

  if ((typeof variableName === 'undefined' ? 'undefined' : _typeof(variableName)) === 'object') {
    Object.keys(variableName).forEach(function (name) {
      rewireData[name] = variableName[name];
    });
  } else {
    if (value === undefined) {
      rewireData[variableName] = INTENTIONAL_UNDEFINED;
    } else {
      rewireData[variableName] = value;
    }

    return function () {
      _reset__(variableName);
    };
  }
}

function _reset__(variableName) {
  var rewireData = _getRewiredData__();

  delete rewireData[variableName];

  if (Object.keys(rewireData).length == 0) {
    delete _getRewireRegistry__()[_getRewireModuleId__];
  }

  ;
}

function _with__(object) {
  var rewireData = _getRewiredData__();

  var rewiredVariableNames = Object.keys(object);
  var previousValues = {};

  function reset() {
    rewiredVariableNames.forEach(function (variableName) {
      rewireData[variableName] = previousValues[variableName];
    });
  }

  return function (callback) {
    rewiredVariableNames.forEach(function (variableName) {
      previousValues[variableName] = rewireData[variableName];
      rewireData[variableName] = object[variableName];
    });
    var result = callback();

    if (!!result && typeof result.then == 'function') {
      result.then(reset).catch(reset);
    } else {
      reset();
    }

    return result;
  };
}

exports.__get__ = _get__;
exports.__GetDependency__ = _get__;
exports.__Rewire__ = _set__;
exports.__set__ = _set__;
exports.__ResetDependency__ = _reset__;
exports.__RewireAPI__ = _RewireAPI__;
exports.default = _RewireAPI__;