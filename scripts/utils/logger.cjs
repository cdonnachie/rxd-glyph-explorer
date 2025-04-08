// CommonJS version of the logger
const fs = require('fs');
const path = require('path');

// Get config
const { config } = require('../config.cjs');

// Ensure log directory exists
const logDir = path.dirname(config.logging.filePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
};

class Logger {
  constructor() {
    this.level = LOG_LEVELS[config.logging.level] || LOG_LEVELS.info;
  }

  log(level, message, data) {
    if (LOG_LEVELS[level] <= this.level) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      // Log to console
      console.log(logMessage);
      if (data) {
        console.log(data);
      }

      // Log to file
      const logEntry = `${logMessage}${data ? " " + JSON.stringify(data, null, 2) : ""}\n`;
      fs.appendFileSync(config.logging.filePath, logEntry);
    }
  }

  error(message, data) {
    this.log("error", message, data);
  }

  warn(message, data) {
    this.log("warn", message, data);
  }

  info(message, data) {
    this.log("info", message, data);
  }

  verbose(message, data) {
    this.log("verbose", message, data);
  }

  debug(message, data) {
    this.log("debug", message, data);
  }
}

const logger = new Logger();

module.exports = { logger };

