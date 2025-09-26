import 'dotenv/config';
import { Application } from 'express';
declare class Server {
    app: Application;
    server: any;
    private port;
    constructor();
    private initializeMiddleware;
    private initializeRoutes;
    private initializeErrorHandling;
    start(): Promise<void>;
    private gracefulShutdown;
    getApp(): Application;
    getServer(): any;
}
export default Server;
//# sourceMappingURL=server.d.ts.map