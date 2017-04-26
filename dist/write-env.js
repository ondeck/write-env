'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.__RewireAPI__ = exports.__ResetDependency__ = exports.__set__ = exports.__Rewire__ = exports.__GetDependency__ = exports.__get__ = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _prettyError = require('pretty-error');

var _prettyError2 = _interopRequireDefault(_prettyError);

var _cliTable = require('cli-table2');

var _cliTable2 = _interopRequireDefault(_cliTable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var prettyError = _get__('pe').start();

// Style errors
_get__('prettyError').appendStyle({

  'pretty-error > header > colon': {
    color: 'bright-white',
    background: 'red'
  },

  'pretty-error > header > message': {
    color: 'bright-white',
    background: 'black',
    padding: '0 1'
  },

  'pretty-error > trace': { display: 'none' }
});

var WriteEnv = function () {

  /**
   * constructor
   *
   * creates a new instance of WriteEnv which reads default
   * environment variable settings and outputs them to stdout,
   * or creates an environment variable file (.env) based on defaults.
   *
   * A prompt to overwrite is issued if an existing .env file is found.
   *
   * @return {WriteEnv} an instance of WriteEnv
   */
  function WriteEnv() {
    _classCallCheck(this, WriteEnv);

    this.options = {
      print: false,
      create: false,
      showHelp: false,
      environment: 'default'
    };

    this.overrides = [];
    this.defaults = [];
  }

  /**
   * log
   *
   * A wrapper around console.log for easier testing.
   *
   * @param {String} message A message to log to the console
   *
   * @memberOf WriteEnv
   */


  _createClass(WriteEnv, [{
    key: 'log',
    value: function log(message) {
      console.log(message);
    }

    /**
     * run
     *
     * executes the application by parsing any arguments passed in
     * and returning the appropriate method.
     *
     * @return {undefined}
     */

  }, {
    key: 'run',
    value: function run() {
      // initialize data
      this.parseArgs();

      // if showHelp is true don't do anything else, just in case
      if (this.options.showHelp) return this.showHelp();

      if (this.options.version) return this.showVersion();

      this.readEnvironmentDefaults();

      // overrides were supplied,
      // implement only if create: true or print: true
      if (this.overrides.length > 0) {
        if (this.options.create || this.options.print) {
          this.assignOverrides();
        } else {
          this.log('Ignoring overrides as create flag is not set.');
        }
      }

      // if print is true, show that before create due to user prompts
      if (this.options.print) {
        return this.printDefaults();
      }

      // create .env file
      if (this.options.write) {
        this.writeDotEnv();
      }
    }

    /**
     * parseArgs
     *
     * Parses cli args into known options
     *
     * @return {Object}     Hash of boolean options
     */

  }, {
    key: 'parseArgs',
    value: function parseArgs() {
      var _this = this;

      var rawArgs = process.argv.slice(2);
      var booleanArgs = ['c', 'create', 'h', 'help', '?', 'f', 'force', 'p', 'print', 'v', 'version'];
      var validArgs = ['_', 'd', 'destination', 'e', 'environment', 's', 'source'].concat(booleanArgs);
      var args = _get__('minimist')(rawArgs, { boolean: booleanArgs });
      var errorOutputString = '';
      var invalidArgs = [];
      var _options = void 0,
          keyVal = void 0;

      // flag to determine if we've toggled any argument
      var argToggle = false;

      _options = this.options;

      // write the env file if there is no help or print flag
      if (!args.print && !args.help && !args.h && !args['?'] && !args.p) {
        _options.write = true;
      }

      // create flags
      if (args.c || args.create) _options.create = args.c || args.create;

      // create flags
      if (args.v || args.version) _options.version = args.v || args.version;

      // help flags
      if (args.h || args['?'] || args.help) _options.showHelp = args.h || args['?'] || args.help;

      // print flag
      if (args.p || args.print) _options.print = args.p || args.print;

      // force overrides
      if (args.f || args.force) _options.force = args.f || args.force;

      // source path
      if (args.s || args.source) _options.source = args.s || args.source;

      // destination path
      if (args.d || args.destination) _options.destination = args.d || args.destination;

      // environment
      if (args.e || args.environment) _options.environment = args.e || args.environment;

      // overrides
      args._.forEach(function (arg) {
        keyVal = arg.split('=');
        if (keyVal[1]) {
          _this.overrides.push({
            name: keyVal[0],
            value: keyVal[1]
          });
        } else {
          invalidArgs.push(arg);
        }
      });

      // invalid args
      Object.keys(args).filter(function (arg) {
        return !validArgs.includes(arg);
      }).forEach(function (arg) {
        invalidArgs.push(arg);
      });

      if (invalidArgs.length) {
        this.log(invalidArgs.reduce(function (acc, arg) {
          return acc + ('\n - ' + arg);
        }, 'The following options were ignored: '));
      }
    }

    /**
     * getSource
     *
     * Returns the contents of a source file. By default, it looks for a package.json file
     *
     * @param {String}  jsonPath Path to a source file
     * @return {Array}  Collection of Environment Variable descriptions
     */

  }, {
    key: 'getSource',
    value: function getSource() {
      var sourcePath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _get__('path').resolve(process.cwd(), this.options.source || 'package.json');

      try {
        return require(sourcePath);
      } catch (err) {
        console.log('Could not find a source file for write-env.');
        process.exit(1);
      }
    }

    /**
     * readEnvironmentDefaults
     *
     * reads environment variable defaults from a source, like package.json
     *
     * @return {Array}  Collection of Environment Variable descriptions
     */

  }, {
    key: 'readEnvironmentDefaults',
    value: function readEnvironmentDefaults() {
      var environment = this.options.environment;
      var source = this.getSource();
      var errorMsg = void 0;

      if (!source) {
        errorMsg = 'Could not find a vaglid source file for write-env.';
        errorMsg += 'Please consult the documentation on setting up write-env.\n';
      }

      if (source['write-env'] && source['write-env'][environment]) {
        return this.defaults = source['write-env'][environment];
      }

      if (source['write-env'] && !source['write-env'][environment]) {
        errorMsg = 'Missing "' + environment + '" member of "write-env" in source file.\n';
        errorMsg += 'Please consult the documentation on setting up write-env with multiple environment support.\n';
      }

      if (!source['write-env']) {
        errorMsg = 'Missing "write-env" member of source file.\n';
        errorMsg += 'Please consult the documentation on setting up write-env.\n';
      }

      // don't display error if help is requested
      if (this.options.showHelp) {
        return;
      }

      throw new Error(errorMsg);
    }
  }, {
    key: 'assignOverrides',
    value: function assignOverrides() {
      var _this2 = this;

      var defaults = this.defaults,
          overrides = this.overrides;

      if (overrides.length === 0) {
        return;
      }

      // loop through defaults,
      // looking for matching override
      defaults.forEach(function (env) {
        var override = void 0,
            index = void 0;

        override = overrides.find(function (obj, oIDX) {
          if (obj.name === env.name) {
            index = oIDX;
            return true;
          }

          return false;
        });

        // found an override setting
        if (override) {
          // override value to defaults & remove from list of overrides
          env.default = override.value;
          overrides.splice(index, 1);
        }
      });

      // loop through remaining overrides
      // assign values to defaults - new variables
      overrides.forEach(function (obj) {
        _this2.defaults.push({
          name: obj.name,
          default: obj.value
        });
      });
    }

    /**
     * writeDotEnv
     *
     * Creates a .env file if the file does not exist,
     * and prompts the user if it does exist.
     *
     * @return {undefined}
     */

  }, {
    key: 'writeDotEnv',
    value: function writeDotEnv() {
      var _this3 = this;

      var environment = this.options.environment;
      var filePath = void 0;
      var fileName = void 0;

      fileName = environment === 'default' ? '.env' : '.env.' + environment;
      filePath = _get__('path').resolve(process.cwd(), this.options.destination || fileName);

      // check if .env exists
      _get__('fs').access(filePath, _get__('fs').F_OK, function (err) {
        if (err) {
          // file does not exist
          _this3.writeStream(filePath).catch(function (err) {
            return console.log(err);
          });
          return;
        }

        // file exists
        _this3.promptUser(filePath);
      });
    }

    /**
     * writeStream
     *
     * Creates a WritableStream and writes environment
     * variable data. Exiting on error and completion.
     * Environment variables are read in from package.json
     *
     * @param  {String} path Path of file on system
     * @return {undefined}
     */

  }, {
    key: 'writeStream',
    value: function writeStream(path) {
      var _this4 = this;

      var stream = _get__('fs').createWriteStream(path);
      var msg = void 0;
      return new Promise(function (resolve, reject) {
        stream.on('open', function () {
          // stream is open/ file exists
          _this4.defaults.forEach(function (env) {
            stream.write(env.name + '=' + env.default + '\n');
          });

          stream.end();
        }).on('error', function (err) {
          reject(new Error('Error writing to ' + path + '.\nCheck that the path and permissions are correct.'));
        }).on('finish', function () {
          msg = 'Environment variables file created at: ' + _get__('colors').green(path) + '\n';
          msg += _get__('colors').yellow('Note:') + '\n';
          msg += 'Environment variables can contain sensitive information,\n';
          msg += 'like passwords, that an application needs to run.\n\n';
          msg += 'Therefore it is ' + _get__('colors').red.bold('highly') + ' advised to keep them out of version control\n';
          msg += 'by adding environment variable files to .gitignore\n';
          _this4.log(msg);
          resolve();
        });
      });
    }

    /**
     * setPromptOverrides
     *
     * Overrides question prompts
     *
     * @param  {Object} overrides Object with prompt overrides
     * @return {undefined}      [description]
     */

  }, {
    key: 'setPromptOverrides',
    value: function setPromptOverrides(overrides) {
      _get__('prompt').override = overrides;
    }

    /**
     * promptUser
     *
     * Prompts user that a .env file exists and asks to overwrite file.
     * Exits on negative, writes file and exits on affirmative.
     *
     * @param  {String} path Path of file on system
     * @return {undefined}      [description]
     */

  }, {
    key: 'promptUser',
    value: function promptUser(path) {
      var _this5 = this;

      var message = _get__('colors').red('Environment Variables File Exists!') + '\n' + _get__('colors').green('Overwrite File?'),
          promptSchema = {
        properties: {
          overwrite: {
            message: message,
            validator: /y[es]*|n[o]?/,
            warning: 'Must respond yes or no',
            default: 'no',
            ask: function ask() {
              // only ask to override if force is not true
              return !_this5.options.force;
            }
          }
        }
      };

      _get__('prompt').message = _get__('prompt').delimiter = '';
      _get__('prompt').start();

      return new Promise(function (resolve, reject) {
        _get__('prompt').get(promptSchema, function (err, result) {
          // bail on error
          if (err) {
            reject(new Error('Error Overwriting File.'));
          }

          // bail on user request
          if (result.overwrite.match(/n[o]*/) && !_this5.options.force) {
            console.error('Aborted.');
            process.exit(0);
          }

          // move original to .orig
          _get__('fs').rename(path, path + '.orig', function () {
            // write .env
            _this5.writeStream(path).then(function () {
              return resolve();
            });
          });
        });
      });
    }

    /**
     * printDefaults
     *
     * Outputs default environment variables in table format to stdout.
     * Environment variables are read in from package.json
     *
     * @return {undefined}
     */

  }, {
    key: 'printDefaults',
    value: function printDefaults() {
      var table = new (_get__('Table'))({
        rowHeights: [2],
        head: ['Name', 'Description', 'Default', 'Required'],
        colWidths: [15, 60, 15, 10]
      });

      this.defaults.forEach(function (env) {
        var name = void 0,
            description = void 0,
            isDefault = void 0,
            required = void 0;

        name = env.name;
        description = env.description || '';
        isDefault = env.default || '';
        required = env.required;

        table.push([name, description, isDefault, required]);
      });

      this.log(table.toString());
    }

    /**
     * showHelp
     *
     * Outputs contents of help file to stdout and exits.
     * Exits process after output.
     *
     * @return {undefined}
     */

  }, {
    key: 'showHelp',
    value: function showHelp() {
      var usagePath = _get__('path').resolve(__dirname, 'write-env-usage.txt');
      process.stdout.write(_get__('fs').readFileSync(usagePath, 'utf8'));
      process.exit(0);
    }

    /**
    * showVersion
    *
    * Outputs the current version of write-env and exits.
    *
    * @return {undefined}
    */

  }, {
    key: 'showVersion',
    value: function showVersion() {
      var pkg = require(_get__('path').join(__dirname, '../package.json'));
      process.stdout.write(pkg.version + '\n');
      process.exit(0);
    }
  }]);

  return WriteEnv;
}();

exports.default = _get__('WriteEnv');

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
    case 'pe':
      return _prettyError2.default;

    case 'prettyError':
      return prettyError;

    case 'minimist':
      return _minimist2.default;

    case 'path':
      return _path2.default;

    case 'fs':
      return _fs2.default;

    case 'colors':
      return _colors2.default;

    case 'prompt':
      return _prompt2.default;

    case 'Table':
      return _cliTable2.default;

    case 'WriteEnv':
      return WriteEnv;
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

var _typeOfOriginalExport = typeof WriteEnv === 'undefined' ? 'undefined' : _typeof(WriteEnv);

function addNonEnumerableProperty(name, value) {
  Object.defineProperty(WriteEnv, name, {
    value: value,
    enumerable: false,
    configurable: true
  });
}

if ((_typeOfOriginalExport === 'object' || _typeOfOriginalExport === 'function') && Object.isExtensible(WriteEnv)) {
  addNonEnumerableProperty('__get__', _get__);
  addNonEnumerableProperty('__GetDependency__', _get__);
  addNonEnumerableProperty('__Rewire__', _set__);
  addNonEnumerableProperty('__set__', _set__);
  addNonEnumerableProperty('__reset__', _reset__);
  addNonEnumerableProperty('__ResetDependency__', _reset__);
  addNonEnumerableProperty('__with__', _with__);
  addNonEnumerableProperty('__RewireAPI__', _RewireAPI__);
}

exports.__get__ = _get__;
exports.__GetDependency__ = _get__;
exports.__Rewire__ = _set__;
exports.__set__ = _set__;
exports.__ResetDependency__ = _reset__;
exports.__RewireAPI__ = _RewireAPI__;