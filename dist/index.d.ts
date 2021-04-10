import type { BotOptions, Module, Group } from './types';
export * from './types';
export default class Bot {
    #private;
    readonly options: BotOptions;
    private createApi;
    private login;
    constructor(options: BotOptions);
    register(item: Module | Group): void;
    run(): Promise<void>;
}
