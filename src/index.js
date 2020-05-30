const { cloudConfig } = require('./config');
const { connect } = require('./mongo');
const logger = require('./utils/logger');

module.exports = {
    cloudConfig,
    connect,
    logger
};