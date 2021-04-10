import type { BotOptions, Module, Group, Identity } from './types';
import { EntoliList } from 'entoli';
import Client from 'nodemw';
import ora from 'ora';
import { URL } from 'url';
import { promisify } from 'util';

export * from './types';

type AsyncResultCallback<T, E = Error> = (err?: E | null, result?: T) => void;
interface Api {
    login: () => Promise<any>;
    get: (title: string) => Promise<string>;
    edit: (title: string, content: string, summary: string) => Promise<Record<string, any>>;
    move: (from: string, to: string, summary: string) => Promise<Record<string, any>>;
    upload: (title: string, data: Buffer, summary: string) => Promise<Record<string, any>>;
    delete: (title: string, reason: string) => Promise<Record<string, any>>;
    getImageSha1: (title: string) => Promise<{ sha1: string } | null>;
    getAllPages: (namespace: number) => Promise<Array<{ pageid: number; ns: number; title: string }>>;
}

export default class Bot {
    #options: BotOptions;
    #items: Array<Module | Group>;

    private createApi(identity: Identity): Api {
        const url = new URL(this.#options.url);
        const client = new Client({
            protocol: url.protocol.replace(/:$/, ''),
            server: url.host,
            path: url.pathname,
            username: identity.username,
            password: identity.password,
            concurrency: this.#options.concurrency ?? 1,
            debug: this.#options.debug ?? false
        });
        return {
            login: promisify((callback: AsyncResultCallback<any>) => client.logIn(callback)),
            get: promisify((title: string, callback: AsyncResultCallback<string>) =>
                client.getArticle(title, true, callback)
            ),
            edit: promisify(
                (title: string, content: string, summary: string, callback: AsyncResultCallback<Record<string, any>>) =>
                    client.edit(title, content, summary, false, callback)
            ),
            move: promisify(
                (from: string, to: string, summary: string, callback: AsyncResultCallback<Record<string, any>>) =>
                    client.move(from, to, summary, callback)
            ),
            upload: promisify(
                (title: string, data: Buffer, summary: string, callback: AsyncResultCallback<Record<string, any>>) =>
                    client.upload(title, data, summary, callback)
            ),
            delete: promisify((title: string, reason: string, callback: AsyncResultCallback<Record<string, any>>) =>
                client.delete(title, reason, callback)
            ),
            getImageSha1: promisify((title: string, callback: AsyncResultCallback<{ sha1: string } | null>) => {
                client.api.call(
                    { action: 'query', titles: title, prop: 'imageinfo', iiprop: 'sha1' },
                    (err: Error, result: any) => {
                        if (err != null) {
                            callback(err);
                            return;
                        }
                        const normalized = result.normalized.find((item: any) => item.from === title);
                        const to = normalized == null ? title : normalized.to;
                        const page: any = Object.values(result.pages).find((page: any) => page.title === to);
                        callback(null, page == null ? null : Array.isArray(page.imageinfo) ? page.imageinfo[0] : null);
                    }
                );
            }),
            getAllPages: promisify(
                (
                    namespace: number,
                    callback: AsyncResultCallback<Array<{ pageid: number; ns: number; title: string }>>
                ) => client.getPagesInNamespace(namespace, callback)
            )
        };
    }

    private async login(api: Api): Promise<boolean> {
        let spinner = ora('正在登录帐号').start();
        try {
            const response = await api.login();
            spinner = spinner.succeed(`成功以 ${response.lgusername}(${response.lguserid}) 身份登录`);
            return true;
        } catch (err) {
            spinner = spinner.fail(`登录失败：${err.message}`);
            return false;
        }
    }

    constructor(readonly options: BotOptions) {
        this.#options = options;
        this.#items = [];
    }

    register(item: Module | Group) {
        this.#items.push(item);
    }

    async run() {
        if (this.#items.length === 0) {
            console.log('无可执行的操作，程序退出。');
            return;
        }

        let loggedIn = false;
        const defaultLogin = async (): Promise<boolean> => {
            if (loggedIn === true) return;
            const defaultApi = this.createApi(this.#options.defaultIdentity);
            return (loggedIn = await this.login(defaultApi));
        };

        // await defaultLogin();

        const menuItems = [];
        for (const item of this.#items.filter(item => Array.isArray(item['modules']))) menuItems.push(item.title, item);

        const list = new EntoliList(menuItems);
        console.log(await list());
    }
}
