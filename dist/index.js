"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _options, _items;
Object.defineProperty(exports, "__esModule", { value: true });
const entoli_1 = require("entoli");
const nodemw_1 = __importDefault(require("nodemw"));
const ora_1 = __importDefault(require("ora"));
const url_1 = require("url");
const util_1 = require("util");
__exportStar(require("./types"), exports);
class Bot {
    constructor(options) {
        this.options = options;
        _options.set(this, void 0);
        _items.set(this, void 0);
        __classPrivateFieldSet(this, _options, options);
        __classPrivateFieldSet(this, _items, []);
    }
    createApi(identity) {
        var _a, _b;
        const url = new url_1.URL(__classPrivateFieldGet(this, _options).url);
        const client = new nodemw_1.default({
            protocol: url.protocol.replace(/:$/, ''),
            server: url.host,
            path: url.pathname,
            username: identity.username,
            password: identity.password,
            concurrency: (_a = __classPrivateFieldGet(this, _options).concurrency) !== null && _a !== void 0 ? _a : 1,
            debug: (_b = __classPrivateFieldGet(this, _options).debug) !== null && _b !== void 0 ? _b : false
        });
        return {
            login: util_1.promisify((callback) => client.logIn(callback)),
            get: util_1.promisify((title, callback) => client.getArticle(title, true, callback)),
            edit: util_1.promisify((title, content, summary, callback) => client.edit(title, content, summary, false, callback)),
            move: util_1.promisify((from, to, summary, callback) => client.move(from, to, summary, callback)),
            upload: util_1.promisify((title, data, summary, callback) => client.upload(title, data, summary, callback)),
            delete: util_1.promisify((title, reason, callback) => client.delete(title, reason, callback)),
            getImageSha1: util_1.promisify((title, callback) => {
                client.api.call({ action: 'query', titles: title, prop: 'imageinfo', iiprop: 'sha1' }, (err, result) => {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    const normalized = result.normalized.find((item) => item.from === title);
                    const to = normalized == null ? title : normalized.to;
                    const page = Object.values(result.pages).find((page) => page.title === to);
                    callback(null, page == null ? null : Array.isArray(page.imageinfo) ? page.imageinfo[0] : null);
                });
            }),
            getAllPages: util_1.promisify((namespace, callback) => client.getPagesInNamespace(namespace, callback))
        };
    }
    login(api) {
        return __awaiter(this, void 0, void 0, function* () {
            let spinner = ora_1.default('正在登录帐号').start();
            try {
                const response = yield api.login();
                spinner = spinner.succeed(`成功以 ${response.lgusername}(${response.lguserid}) 身份登录`);
                return true;
            }
            catch (err) {
                spinner = spinner.fail(`登录失败：${err.message}`);
                return false;
            }
        });
    }
    register(item) {
        __classPrivateFieldGet(this, _items).push(item);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet(this, _items).length === 0) {
                console.log('无可执行的操作，程序退出。');
                return;
            }
            let loggedIn = false;
            const defaultLogin = () => __awaiter(this, void 0, void 0, function* () {
                if (loggedIn === true)
                    return;
                const defaultApi = this.createApi(__classPrivateFieldGet(this, _options).defaultIdentity);
                return (loggedIn = yield this.login(defaultApi));
            });
            // await defaultLogin();
            const menuItems = [];
            for (const item of __classPrivateFieldGet(this, _items).filter(item => Array.isArray(item['modules'])))
                menuItems.push(item.title, item);
            const list = new entoli_1.EntoliList(menuItems);
            console.log(yield list());
        });
    }
}
exports.default = Bot;
_options = new WeakMap(), _items = new WeakMap();
