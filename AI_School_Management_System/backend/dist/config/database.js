"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseHealth = exports.disconnectDatabase = exports.connectDatabase = exports.databaseManager = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("@/utils/logger");
class DatabaseManager {
    constructor() {
        this.connectionPromise = null;
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    async connect() {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }
        const config = this.getConfig();
        this.connectionPromise = mongoose_1.default.connect(config.uri, config.options);
        try {
            const connection = await this.connectionPromise;
            this.setupEventListeners();
            logger_1.logger.info('✅ Database connected successfully');
            return connection;
        }
        catch (error) {
            this.connectionPromise = null;
            logger_1.logger.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
            this.connectionPromise = null;
            logger_1.logger.info('🔌 Database disconnected');
        }
    }
    getConfig() {
        const uri = process.env.NODE_ENV === 'test'
            ? process.env.MONGODB_TEST_URI
            : process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('Database URI not found in environment variables');
        }
        return {
            uri,
            options: {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
                bufferMaxEntries: 0,
                retryWrites: true,
                w: 'majority',
                strict: true,
                strictQuery: true,
            }
        };
    }
    setupEventListeners() {
        mongoose_1.default.connection.on('connected', () => {
            logger_1.logger.info('📊 MongoDB connection established');
        });
        mongoose_1.default.connection.on('error', (error) => {
            logger_1.logger.error('📊 MongoDB connection error:', error);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('📊 MongoDB connection disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.logger.info('📊 MongoDB connection re-established');
        });
        process.on('SIGINT', async () => {
            try {
                await this.disconnect();
                logger_1.logger.info('🛑 Database connection closed through app termination');
                process.exit(0);
            }
            catch (error) {
                logger_1.logger.error('Error during database disconnection:', error);
                process.exit(1);
            }
        });
    }
    getConnectionState() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        return states[mongoose_1.default.connection.readyState] || 'unknown';
    }
    async healthCheck() {
        try {
            if (mongoose_1.default.connection.readyState === 1) {
                await mongoose_1.default.connection.db.admin().ping();
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
            return false;
        }
    }
}
exports.databaseManager = DatabaseManager.getInstance();
const connectDatabase = () => exports.databaseManager.connect();
exports.connectDatabase = connectDatabase;
const disconnectDatabase = () => exports.databaseManager.disconnect();
exports.disconnectDatabase = disconnectDatabase;
const getDatabaseHealth = () => exports.databaseManager.healthCheck();
exports.getDatabaseHealth = getDatabaseHealth;
//# sourceMappingURL=database.js.map