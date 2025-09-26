import mongoose from 'mongoose';
declare class DatabaseManager {
    private static instance;
    private connectionPromise;
    private constructor();
    static getInstance(): DatabaseManager;
    connect(): Promise<typeof mongoose>;
    disconnect(): Promise<void>;
    private getConfig;
    private setupEventListeners;
    getConnectionState(): string;
    healthCheck(): Promise<boolean>;
}
export declare const databaseManager: DatabaseManager;
export declare const connectDatabase: () => Promise<typeof mongoose>;
export declare const disconnectDatabase: () => Promise<void>;
export declare const getDatabaseHealth: () => Promise<boolean>;
export {};
//# sourceMappingURL=database.d.ts.map