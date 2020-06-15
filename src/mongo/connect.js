const { MongoClient } = require('mongodb');

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

const connect = async (handler) => {
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

    const mongoConnectionString = `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}/${mongoDb}?authSource=${mongoAuthDb}`;
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