export interface Identity {
    username: string;
    password: string;
}

export interface BotOptions {
    url: string;
    defaultIdentity: Identity;
    debug?: boolean;
    concurrency?: number;
}

export interface Context {
    debug: boolean;
}

export interface Content {
    content: string | Buffer;
    summary?: string;
    identity?: Identity;
}

export interface Page {
    title: string;
    getContent: (context: Context) => Promise<Content>;
}

export interface Executor {
    (): AsyncGenerator<Page>;
    (): Promise<void>;
}

export interface Module {
    title: string;
    executor: Executor;
    identity?: Identity;
}

export interface Group {
    title: string;
    modules: Module[];
}
