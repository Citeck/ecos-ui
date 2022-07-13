/**
 * Reworked library "logplease"
 * https://github.com/haadcode/logplease
 */

import get from 'lodash/get';
import isUndefined from 'lodash/isUndefined';

const fs = require('fs');
const format = require('util').format;
const EventEmitter = require('events').EventEmitter;

let isNodejs = false;

const LogLevels = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  NONE: 'NONE'
};

// Global log level
let GlobalLogLevel = LogLevels.DEBUG;

// Global log file name
let GlobalLogfile = null;

let GlobalEvents = new EventEmitter();

// ANSI colors
let Colors = {
  Black: 0,
  Red: 1,
  Green: 2,
  Yellow: 3,
  Blue: 4,
  Magenta: 5,
  Cyan: 6,
  Grey: 7,
  White: 9,
  Default: 9
};

// CSS colors
if (!isNodejs) {
  Colors = {
    Black: 'Black',
    Red: 'IndianRed',
    Green: 'LimeGreen',
    Yellow: 'Orange',
    Blue: 'RoyalBlue',
    Magenta: 'Orchid',
    Cyan: 'SkyBlue',
    Grey: 'DimGrey',
    White: 'White',
    Default: 'Black'
  };
}

const loglevelColors = [Colors.Cyan, Colors.Green, Colors.Yellow, Colors.Red, Colors.Default];

const defaultOptions = {
  useColors: true,
  color: Colors.Default,
  showTimestamp: true,
  useLocalTime: false,
  showLevel: true,
  filename: GlobalLogfile,
  appendFile: true
};

class Logger {
  constructor(category, options) {
    this.category = category;
    let opts = {};

    Object.assign(opts, defaultOptions);
    Object.assign(opts, options);

    this.options = opts;
  }

  debug = (...attrs) => {
    if (this._shouldLog(LogLevels.DEBUG)) {
      this._write(LogLevels.DEBUG, ...this._getMessage(...attrs));
    }
  };

  log = (...attrs) => {
    if (this._shouldLog(LogLevels.DEBUG)) {
      this.debug(...attrs);
    }
  };

  info = (...attrs) => {
    if (this._shouldLog(LogLevels.INFO)) {
      this._write(LogLevels.INFO, ...this._getMessage(...attrs));
    }
  };

  warn = (...attrs) => {
    if (this._shouldLog(LogLevels.WARN)) {
      this._write(LogLevels.WARN, ...this._getMessage(...attrs));
    }
  };

  error = (...attrs) => {
    if (this._shouldLog(LogLevels.ERROR)) {
      this._write(LogLevels.ERROR, ...this._getMessage(...attrs));
    }
  };

  _getMessage(...params) {
    const errorIndex = params.findIndex(item => !!get(item, 'stack') || item instanceof Error);
    let error = '';

    if (errorIndex !== -1) {
      error = params.splice(errorIndex, 1)[0];
    }

    let message = format.apply(null, params);

    return [message, error];
  }

  _write(level, text, error) {
    if ((this.options.filename || GlobalLogfile) && !this.fileWriter && isNodejs) {
      this.fileWriter = fs.openSync(this.options.filename || GlobalLogfile, this.options.appendFile ? 'a+' : 'w+');
    }

    let format = this._format(level, text);
    let unformattedText = this._createLogMessage(level, text);
    let formattedText = this._createLogMessage(level, text, format.timestamp, format.level, format.category, format.text);

    if (this.fileWriter && isNodejs) {
      fs.writeSync(this.fileWriter, unformattedText + '\n', null, 'utf-8');
    }

    if (isNodejs || !this.options.useColors) {
      console.log(formattedText);
      GlobalEvents.emit('data', this.category, level, text);
    } else {
      const type = level === LogLevels.ERROR ? 'error' : 'log';
      let data = [];

      if (this.options.showTimestamp && this.options.showLevel) {
        data = [formattedText, format.timestamp, format.level, format.category];
      } else if (this.options.showTimestamp && !this.options.showLevel) {
        data = [formattedText, format.timestamp, format.category];
      } else if (!this.options.showTimestamp && this.options.showLevel) {
        data = [formattedText, format.level, format.category];
      } else {
        data = [formattedText, format.category];
      }

      console[type](...data, format.text, error);
    }
  }

  _format(level, text) {
    let timestampFormat = '';
    let levelFormat = '';
    let categoryFormat = '';
    let textFormat = ': ';

    if (this.options.useColors) {
      const levelColor = Object.keys(LogLevels)
        .map(f => LogLevels[f])
        .indexOf(level);
      const categoryColor = this.options.color;

      if (isNodejs) {
        if (this.options.showTimestamp) timestampFormat = `\u001b[3${Colors.Grey}m`;

        if (this.options.showLevel) levelFormat = `\u001b[3${loglevelColors[levelColor]};22m`;

        categoryFormat = `\u001b[3${categoryColor};1m`;
        textFormat = '\u001b[0m: ';
      } else {
        if (this.options.showTimestamp) {
          timestampFormat = `color:${Colors.Grey}`;
        }

        if (this.options.showLevel) {
          levelFormat = `color:${loglevelColors[levelColor]}`;
        }

        categoryFormat = `color: ${categoryColor}; font-weight: bold`;
      }
    }

    return {
      timestamp: timestampFormat,
      level: levelFormat,
      category: categoryFormat,
      text: textFormat
    };
  }

  _createLogMessage(level, text, timestampFormat, levelFormat, categoryFormat, textFormat) {
    timestampFormat = timestampFormat || '';
    levelFormat = levelFormat || '';
    categoryFormat = categoryFormat || '';
    textFormat = textFormat || ': ';

    if (!isNodejs && this.options.useColors) {
      if (this.options.showTimestamp) {
        timestampFormat = '%c';
      }

      if (this.options.showLevel) {
        levelFormat = '%c';
      }

      categoryFormat = '%c';
      textFormat = ': %c';
    }

    let result = '';

    if (this.options.showTimestamp && !this.options.useLocalTime) {
      result += '' + new Date().toISOString() + ' ';
    }

    if (this.options.showTimestamp && this.options.useLocalTime) {
      result += '' + new Date().toLocaleString() + ' ';
    }

    result = timestampFormat + result;

    if (this.options.showLevel) {
      result += `${levelFormat}[${level}]${[LogLevels.INFO, LogLevels.WARN].includes(level) ? ' ' : ''} `;
    }

    result += categoryFormat + this.category;
    result += textFormat + text;

    return result;
  }

  _shouldLog(level) {
    let envLogLevel =
      process !== 'undefined' && !isUndefined(process.env) && !isUndefined(process.env.LOG) ? process.env.LOG.toUpperCase() : null;

    envLogLevel = typeof window !== 'undefined' && window.LOG ? window.LOG.toUpperCase() : envLogLevel;

    const logLevel = envLogLevel || GlobalLogLevel;
    const levels = Object.keys(LogLevels).map(f => LogLevels[f]);
    const index = levels.indexOf(level);
    const levelIdx = levels.indexOf(logLevel);
    return index >= levelIdx;
  }
}

/* Public API */
export default {
  Colors: Colors,
  LogLevels: LogLevels,
  setLogLevel: level => {
    GlobalLogLevel = level;
  },
  setLogfile: filename => {
    GlobalLogfile = filename;
  },
  create: (category, options) => {
    return new Logger(category, options);
  },
  forceBrowserMode: force => (isNodejs = !force), // for testing,
  events: GlobalEvents
};
