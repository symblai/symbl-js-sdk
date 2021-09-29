interface SymblConfig {
    appId: string;
    appSecret: string;
    basePath?: string;
    logLevel?: string;
}

interface OAuth2Object {
    apiClient: any;
    authenticationApi: any;
    activeToken: string;
    updatedOn: Date;
    expiresOn: Date;
    expiresIn: number;
    automaticallyRefreshToken: any;
    refreshTimeBeforeExpiry: any;
    refreshOn: Date;
    init(appId: string, appSecret: string, ...args: any[]): Promise<any>;
    processTokenResult(data: any): void;
    getApiClient(): any;
    appId: string;
    appSecret: string;
}

