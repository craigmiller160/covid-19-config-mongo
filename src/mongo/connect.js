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

const { MongoClient } = require('mongodb');
const handleMongoPasswordEnv = require('./handleMongoPasswordEnv');

handleMongoPasswordEnv();

const logger = require('../utils/logger');

const getConfig = async () => {
    if (process.env.USE_CONFIG_SERVER.toLowerCase() === 'true') {
        const { cloudConfig, MONGO_HOST, MONGO_AUTH_DB, MONGO_PASS, MONGO_USER, MONGO_PORT } = require('../config');
        await cloudConfig.init();
        const mongoUser = cloudConfig.config[MONGO_USER];
        const mongoPass = cloudConfig.config[MONGO_PASS];
        const mongoAuthDb = cloudConfig.config[MONGO_AUTH_DB]
        const mongoHost = cloudConfig.config[MONGO_HOST];
        const mongoPort = cloudConfig.config[MONGO_PORT];

        return {
            mongoUser,
            mongoPass,
            mongoAuthDb,
            mongoHost,
            mongoPort
        };
    } else {
        const mongoUser = process.env.MONGO_USER;
        const mongoPass = process.env.MONGO_PASSWORD;
        const mongoAuthDb = process.env.MONGO_AUTH_DB;
        const mongoHost = process.env.MONGO_HOST;
        const mongoPort = process.env.MONGO_PORT;

        return {
            mongoUser,
            mongoPass,
            mongoAuthDb,
            mongoHost,
            mongoPort
        };
    }
};

const buildMongoConnectionString = async () => {
    const {
        mongoUser,
        mongoPass,
        mongoAuthDb,
        mongoHost,
        mongoPort
    } = await getConfig();

    const dbName = process.env.MONGO_DATABASE;
    const profile = process.env.ACTIVE_PROFILE;
    const mongoDb = `${dbName}_${profile}`;

    const credsString = `${mongoUser}:${mongoPass}@`
    const coreConnectString = `${mongoHost}:${mongoPort}/${mongoDb}?authSource=${mongoAuthDb}`;
    const tlsString = `&tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true`;

    if (profile === 'test') {
        return `mongodb://${coreConnectString}`;
    }

    return `mongodb://${credsString}${coreConnectString}${tlsString}`;
};

const connect = async (handler) => {
    const mongoConnectionString = await buildMongoConnectionString();
    const options = {
        useUnifiedTopology: true
    };

    logger.debug(`MongoDB Connection String: ${mongoConnectionString}`);

    let client;
    try {
        client = await MongoClient.connect(mongoConnectionString, options);
        const db = client.db();
        return await handler(db);
    } finally {
        if (client) {
            await client.close();
        }
    }
};

module.exports = connect;