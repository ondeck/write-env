# write-env

**Environment variables are not meant to be checked into version control.**

write-env is a command-line utility to create environment variable files. Variables can be defined as a `write-env` member in the application's package.json, or supplied at run-time.

In accordance with [The Twelve-Factor App](https://12factor.net/), a methodology for building modern web applications, configuration should be stored in the environment [<font size="2">(III. Config)</font>](https://12factor.net/config).

Since application configuration is not in version control, information necessary to run the application needs to be distributed somehow.


The intent of write-env, is to ease the process of setting up new environments with the configuration information needed to run the application and without polluting the codebase with a superfluous file like `sample.env`.

### Install
write-env is a command-line utility, so in most cases, it should be installed globally.

```bash
npm i -g write-env
```

### Configuration
write-env loads package.json and parses it, looking for a `write-env` Object. The members of the `write-env` Object describe the various environment configurations you may need, as an Array of environemnt variable Objects. Each variable Object contains information about the variable.

For each setting, the only variable members required are `name` and `default`.
There must be a `default` member of `write-env`, any others are optional.
`default` creates a `.env` file, while others will append the environment to the filename (i.e. `.env.test`).

**Example package.json**

```json
{

  "write-env": {
    "default": [
      {
        "name":        "FOO",
        "description": "Foo for Great Justice!",
        "default":     "foo",
        "required":    true
      },
      {
        "name":        "BAR",
        "description": "simply not foo.",
        "default":     "bar",
        "required":    false
      }
    ],
    // optional configurations
    "dev": [
      {
        "name": "...",
      },
      "..."
    ],
    "test": [
      {
        "name": "...",
      },
      "..."
    ],
    "foo": [
      {
        "name": "...",
      },
      "..."
    ]
  },

  "...additional package.json data..."

}
```

##### Definitions
`name` <font size="2"> *(Required)*</font>
The name of the environment variable.

`description` <font size="2"> *(Optional - Defaults to `''`)*</font>
The description of the variable or its intent.

`default` <font size="2"> *(Optional - Defaults to `''`)*</font>
The default value of the variable.

`required` <font size="2"> *(Optional - Defaults to `false`)*</font>
Boolean value indicating the app needs this value defined to run.


### Usage
Once installed, the application should add a binary to the node_modules directory.
Calling `write-env` will run the script. If a .env file exists already, a prompt will ask if you would like to overwrite the file or abort. As a precaution when overwriting, the original file is stored as a backup `.orig` file for reference.

**create a .env file**

`write-env`

**specify a different source file**

`write-env -s=custom.json` **or** `write-env --source=custom.json`

**specify a different destination file**

`write-env -d=foo.env` **or** `write-env --destination=foo.env`

**create a .env.dev file** assumes package.json has a write-env member with a dev member

`write-env -e=dev`

**print information about the current write-env status**

`write-env -p` **or** `write-env --print`

**output help text**

`write-env -h` **or** `write-env --help` **or** `write-env -?`

**force overwrite existing files**

`write-env -f` **or** `write-env --force`

>**Note:**
The above assumes a global install. If write-env was installed as a dependency, the path to write-env would be
`./node_modules/.bin/write-env`

### Overrides
Additionally, passing key=value options will add those values to the environment file, overriding any default values if the key already exists.

**Override Example**
given the following package.json:

```json
{
  "write-env": {
    "default": [
      {
        "name":      "FOO",
        "description": "Foo for Great Justice!",
        "default":     "foo",
        "required":    true
      }
    ]
  }
}
```

running the following command:

`write-env -c FOO=bar BAR=baz PORT=0000`

will output this `.env` file:

```
FOO=bar
BAR=baz
PORT=0000
```
