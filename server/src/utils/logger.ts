import path from "node:path";
import winston from "winston";
import "winston-daily-rotate-file";

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? logFormat
          : winston.format.combine(winston.format.colorize(), winston.format.simple())
    }),
    new winston.transports.DailyRotateFile({
      dirname: path.resolve(process.cwd(), "logs"),
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true
    })
  ]
});
