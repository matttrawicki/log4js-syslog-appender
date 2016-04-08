"use strict"

/**
 * Lo
 *
 *
 *
 *
 */


var log4js = require('log4js');
var syslog = require('ain2');


/**
 *
 * @param config
 * @param layout
 * @returns {Function}
 */
function syslogAppender(config, layout) {

    /**
     * adding log level to message string
     *
     * @param loggingEvent
     * @returns {*}
     */
    var fixedLayout = function (loggingEvent) {
        if (layout) {
            return layout(loggingEvent);
        } else {
            return log4js.layouts.messagePassThroughLayout(loggingEvent);
        }
    };

    var tag = config.tag || "log4js";
    var facility = config.facility || "local0";
    var hostname = config.hostname || "localhost";
    var port = config.port || 514;
    var transport = config.transport || "UDP";
    var path = config.path || "/dev/log";
    var reduceDuplication = !!config.reduceDuplication || false;
    var loggerParams = {tag: tag, facility: facility, hostname: hostname, port: port};
    var logger;

    if(transport === "UDP"){
        logger = new syslog(Object.assign(loggerParams, {transport: "UDP", hostname: hostname, port: port}));
    } else if(transport === "socket"){
        logger = new syslog(Object.assign(loggerParams, {transport: "unix_dgram", path: path}));
    }

    if(reduceDuplication) {
        logger.setMessageComposer(function(message, severity) {
            return new Buffer('<' + (this.facility * 8 + severity) + '>' + this.tag + '[' + process.pid + ']:' + message);
        });
    }

    /**
     * the logging
     */
    return function (loggingEvent) {

        var logLevels = {
            5000: logger.trace,
            10000: logger.debug,
            20000: logger.info,
            30000: logger.warn,
            40000: logger.error,
            50000: logger.error
        };

        var level = loggingEvent.level.level;

        logLevels[level].call(logger, fixedLayout(loggingEvent));
    };
}

/**
 *
 * @param config
 * @returns {*}
 */
function configure(config) {

    var layout;

    if (config.layout) {
        layout = log4js.layouts.layout(config.layout.type, config.layout);
    }
    return syslogAppender(config, layout);
}

module.exports.name = "log4js-syslog-appender";
module.exports.appender = syslogAppender;
module.exports.configure = configure;
