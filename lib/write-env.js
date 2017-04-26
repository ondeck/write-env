import fs        from 'fs';
import path      from 'path';
import colors    from 'colors';
import minimist  from 'minimist';
import prompt    from 'prompt';
import pe        from 'pretty-error';
import Table     from 'cli-table2';
const prettyError = pe.start();

// Style errors
prettyError.appendStyle({

  'pretty-error > header > colon': {
    color: 'bright-white',
    background: 'red',
  },

  'pretty-error > header > message': {
    color: 'bright-white',
    background: 'black',
    padding: '0 1',
   },

  'pretty-error > trace': { display: 'none' }
});

class WriteEnv {

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
  constructor() {
    this.options = {
      print:       false,
      create:      false,
      showHelp:    false,
      environment: 'default',
    };

    this.overrides = [];
    this.defaults  = [];
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
  log(message) {
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
  run() {
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
      }
      else {
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
  parseArgs() {
    const rawArgs = process.argv.slice(2);
    const booleanArgs = ['c', 'create', 'h', 'help', '?', 'f', 'force', 'p', 'print', 'v', 'version'];
    const validArgs = ['_', 'd', 'destination', 'e', 'environment', 's', 'source', ...booleanArgs];
    const args = minimist(rawArgs, { boolean: booleanArgs });
    let errorOutputString = '';
    let invalidArgs = [];
    let _options, keyVal;

    // flag to determine if we've toggled any argument
    let argToggle = false;

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
    args._
      .forEach(arg => {
        keyVal = arg.split('=');
        if (keyVal[1]) {
          this.overrides.push({
            name: keyVal[0],
            value: keyVal[1]
          });
        }
        else {
          invalidArgs.push(arg);
        }
      });

    // invalid args
    Object.keys(args)
      .filter(arg => !validArgs.includes(arg))
      .forEach(arg => {
        invalidArgs.push(arg);
      });

    if (invalidArgs.length) {
      this.log(invalidArgs.reduce((acc, arg) => {
        return acc + `\n - ${arg}`;
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
  getSource(sourcePath = path.resolve(process.cwd(), this.options.source || 'package.json')) {
    try {
      return require(sourcePath)
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
  readEnvironmentDefaults() {
    const environment = this.options.environment;
    const source = this.getSource();
    let errorMsg;

    if (!source) {
      errorMsg = 'Could not find a vaglid source file for write-env.';
      errorMsg += `Please consult the documentation on setting up write-env.\n`;
    }

    if (source['write-env'] && source['write-env'][environment]) {
      return this.defaults = source['write-env'][environment];
    }

    if (source['write-env'] && !source['write-env'][environment]) {
      errorMsg = `Missing "${environment}" member of "write-env" in source file.\n`;
      errorMsg += `Please consult the documentation on setting up write-env with multiple environment support.\n`;
    }

    if (!source['write-env']) {
      errorMsg = `Missing "write-env" member of source file.\n`;
      errorMsg += `Please consult the documentation on setting up write-env.\n`;
    }

    // don't display error if help is requested
    if (this.options.showHelp) {
      return;
    }

    throw new Error(errorMsg)
  }

  assignOverrides() {
    let defaults = this.defaults,
      overrides  = this.overrides;

    if (overrides.length === 0) {
      return;
    }

    // loop through defaults,
    // looking for matching override
    defaults.forEach((env) => {
      let override, index;

      override = overrides.find((obj, oIDX) => {
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
    overrides.forEach(obj => {
      this.defaults.push({
        name: obj.name,
        default: obj.value,
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
  writeDotEnv() {
    const environment = this.options.environment;
    let filePath;
    let fileName;

    fileName = (environment === 'default') ? '.env' : `.env.${environment}`;
    filePath = path.resolve(process.cwd(), this.options.destination || fileName);

    // check if .env exists
    fs.access(filePath, fs.F_OK, (err) => {
      if (err) {
        // file does not exist
        this.writeStream(filePath).catch(err => console.log(err));
        return;
      }

      // file exists
      this.promptUser(filePath);
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
  writeStream(path) {
    const stream = fs.createWriteStream(path);
    let msg;
    return new Promise((resolve, reject) => {
      stream
        .on('open', () => {
          // stream is open/ file exists
          this.defaults.forEach(env => {
            stream.write(`${env.name}=${env.default}\n`);
          });

          stream.end();
        })
        .on('error', (err) => {
          reject(new Error(`Error writing to ${path}.\nCheck that the path and permissions are correct.`));
        })
        .on('finish', () => {
          msg = `Environment variables file created at: ${colors.green(path)}\n`;
          msg += `${colors.yellow('Note:')}\n`;
          msg += `Environment variables can contain sensitive information,\n`;
          msg += `like passwords, that an application needs to run.\n\n`;
          msg += `Therefore it is ${colors.red.bold('highly')} advised to keep them out of version control\n`;
          msg += `by adding environment variable files to .gitignore\n`;
          this.log(msg);
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
  setPromptOverrides(overrides) {
    prompt.override = overrides
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
  promptUser(path) {
    let message = `${colors.red('Environment Variables File Exists!')}\n${colors.green('Overwrite File?')}`,
      promptSchema = {
        properties: {
          overwrite: {
            message: message,
            validator: /y[es]*|n[o]?/,
            warning: 'Must respond yes or no',
            default: 'no',
            ask: () => {
              // only ask to override if force is not true
              return !this.options.force;
            }
          }
        }
      };

    prompt.message = prompt.delimiter = '';
    prompt.start();

    return new Promise((resolve, reject) => {
      prompt.get(promptSchema, (err, result) => {
        // bail on error
        if (err) {
          reject(new Error('Error Overwriting File.'));
        }

        // bail on user request
        if (result.overwrite.match(/n[o]*/) && !this.options.force) {
          console.error('Aborted.');
          process.exit(0);
        }

        // move original to .orig
        fs.rename(path, path + '.orig', () => {
          // write .env
          this.writeStream(path).then(() => resolve());
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
  printDefaults() {
    let table = new Table({
      rowHeights: [2],
      head: ['Name', 'Description', 'Default', 'Required'],
      colWidths: [15, 60, 15, 10]
    });

    this.defaults.forEach(env => {
      let name, description, isDefault, required;

      name        = env.name;
      description = env.description || '';
      isDefault   = env.default     || '';
      required    = env.required;

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
  showHelp() {
    let usagePath = path.resolve(__dirname, 'write-env-usage.txt');
    process.stdout.write(fs.readFileSync(usagePath, 'utf8'));
    process.exit(0);
  }

    /**
   * showVersion
   *
   * Outputs the current version of write-env and exits.
   *
   * @return {undefined}
   */
  showVersion() {
    const pkg = require(path.join(__dirname, '../package.json'));
    process.stdout.write(pkg.version + '\n');
    process.exit(0);
  }
}

export default WriteEnv;
