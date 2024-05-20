const { createLogger, format, transports } = require("winston")
const { combine, timestamp, printf } = format
// Create a logger instance

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `[${level}] [${timestamp}] : ${message}`
})

module.exports.logger = createLogger({
  level: "info",
  format: combine(timestamp({ format: "HH:mm:ss" }), myFormat),
  transports: [
    new transports.File({
      format: format.json(),
      filename: "error.log",
      level: "error",
    }),
    new transports.File({ format: format.json(), filename: "combined.log" }),
    new transports.Console({
      format: combine(
        format.colorize(),
        timestamp({ format: "HH:mm:ss" }),
        myFormat
      ),
    }),
  ],
})
