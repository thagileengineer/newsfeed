// logger.js
import winston from 'winston';

// Define log levels and colors (optional)
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Create the logger instance
const logger = winston.createLogger({
  levels: logLevels,
  // Define format: Combining timestamp, level, and message
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`
    ),
    // Use JSON format for file logging (better for parsing)
    winston.format.json() 
  ),
  // Define transports (where logs go)
  transports: [
    // 1. Console transport
    new winston.transports.Console({
      level: 'info', // Only log 'info' and higher (warn, error) to the console
      format: winston.format.combine(
          winston.format.colorize(), // Add colors for console output
          winston.format.simple()    // Simple format for readability
      ),
    }),
    // 2. File transport for 'error' logs
    new winston.transports.File({ 
        filename: 'error.log', 
        level: 'error', // Only log 'error'
        maxsize: 5242880, // 5MB 
        maxFiles: 5,
    }),
    // 3. File transport for all logs
    new winston.transports.File({ 
        filename: 'combined.log', 
        level: 'debug', // Log 'debug' and higher
    }),
  ],
});

export default logger;