// config/database.ts - Database configuration and connection
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private connectionPromise: Promise<typeof mongoose> | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<typeof mongoose> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const config = this.getConfig();

    this.connectionPromise = mongoose.connect(config.uri, config.options);

    try {
      const connection = await this.connectionPromise;
      this.setupEventListeners();
      logger.info('✅ Database connected successfully');
      return connection;
    } catch (error) {
      this.connectionPromise = null;
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      this.connectionPromise = null;
      logger.info('🔌 Database disconnected');
    }
  }

  private getConfig(): DatabaseConfig {
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
        // Enable strict mode for better data integrity
        strict: true,
        strictQuery: true,
      }
    };
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      logger.info('📊 MongoDB connection established');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('📊 MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('📊 MongoDB connection disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('📊 MongoDB connection re-established');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await this.disconnect();
        logger.info('🛑 Database connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error during database disconnection:', error);
        process.exit(1);
      }
    });
  }

  public getConnectionState(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (mongoose.connection.readyState === 1) {
        // Perform a simple ping
        await mongoose.connection.db.admin().ping();
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

// Export connection function for convenience
export const connectDatabase = () => databaseManager.connect();
export const disconnectDatabase = () => databaseManager.disconnect();
export const getDatabaseHealth = () => databaseManager.healthCheck();