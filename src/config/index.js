/*
 * covid-19-config-mongo
 * Copyright (C) 2020 Craig Miller
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const cloudConfigClient = require('cloud-config-client');
const shellEnv = require('shell-env');
const retry = require('retry');
const logger = require('../utils/logger');

const MONGO_HOST = 'mongodb.host';
const MONGO_PORT = 'mongodb.port';
const MONGO_USER = 'mongodb.user';
const MONGO_PASS = 'mongodb.password';
const MONGO_AUTH_DB = 'mongodb.authDb';
const CONFIG_LOADED = 'config.loaded';

const getConfig = async (attempt) => {
    logger.info(`Attempt #${attempt} to load cloud configuration`);
    const { CONFIG_SERVER_USER, CONFIG_SERVER_PASSWORD } = shellEnv.sync();
    return await cloudConfigClient.load({
        endpoint: process.env.CLOUD_CONFIG_HOST,
        rejectUnauthorized: false,
        application: process.env.CLOUD_CONFIG_APP,
        profiles: process.env.ACTIVE_PROFILE,
        auth: {
            user: CONFIG_SERVER_USER,
            pass: CONFIG_SERVER_PASSWORD
        }
    });
};

const attemptToGetConfig = () => new Promise((resolve, reject) => {
    const operation = retry.operation({
        retries: process.env.CLOUD_CONFIG_RETRY_ATTEMPTS,
        minTimeout: process.env.CLOUD_CONFIG_RETRY_WAIT
    });

    operation.attempt(async (currentAttempt) => {
        try {
            const config = await getConfig(currentAttempt);
            resolve(config);
        } catch (ex) {
            if (operation.retry(ex)) {
                return;
            }
            reject(ex);
        }
    });
});

class CloudConfig {
    constructor() {
        this.config = {
            [CONFIG_LOADED]: false
        }
    }

    async init() {
        if (this.config[CONFIG_LOADED]) {
            logger.debug('Config already loaded, skipping');
            return;
        }

        logger.info('Loading cloud config values');

        const config = await attemptToGetConfig();

        this.config[MONGO_HOST] = config.get(MONGO_HOST);
        this.config[MONGO_PORT] = config.get(MONGO_PORT);
        this.config[MONGO_USER] = config.get(MONGO_USER);
        this.config[MONGO_PASS] = config.get(MONGO_PASS);
        this.config[MONGO_AUTH_DB] = config.get(MONGO_AUTH_DB);
        this.config[CONFIG_LOADED] = true;

        logger.info('Cloud configuration loaded successfully.');
    }
}

module.exports = {
    MONGO_HOST,
    MONGO_PORT,
    MONGO_USER,
    MONGO_PASS,
    MONGO_AUTH_DB,
    cloudConfig: new CloudConfig()
};