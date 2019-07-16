import { Server } from "http";
import { RequestHandler, Application } from "express";

export as namespace localHttpMock;
export = localHttpMock;

interface MockOptions {
	/**
	 * 如果请求 url 无法映射到本地文件，是否自动响应为 404
	 * 如果你已经添加了 404 处理函数，请设置此选项为 false
	 */
	auto404: boolean;
    /**
     * 是否支持跨域，默认为 true。一般来说不需要配置此选项,
     * 如果你有特殊需求，可以参考 https://github.com/expressjs/cors#configuration-options
     */
    cors?: boolean | object;
    /**
     * 是否解析请求 body，默认为 true。如果你已经使用了 body-parser 之类的 middleware
     * 请设置此值为 false。
     * 如果需要配置 body-parser 参数，请传递对象格式，详细参考：
     * https://github.com/expressjs/body-parser
     */
    parseBody?: boolean | {
        json?: any;
        urlencoded?: any;
        raw?: any;
        text?: any;
    };
    /**
     * 是否解析请求 cookie，默认为 true。如果你已经使用了 cookie-parser 之类的 middleware
     * 请设置此值为 false。
     * 如果需要配置 cookie-parser 参数，请传递对象格式，详细参考：
     * https://github.com/expressjs/cookie-parser
     */
    parseCookie?: boolean | {
        secret: string;
        options: any;
    };
    /**
     * 如果你不想使用 mockrc.json 配置文件，可以手动传递配置给这个参数
     */
    mockRules?: {
        [key: string]: string | {
            /**
             * 代理类型，目前仅支持 websocket
             */
            type?: "websocket",
            /**
             * 假数据根目录。项目代码里面使用 rootDirectory 来引用这个值，
             * 这里为了方便配置，仅仅使用 dir
             */
            dir: ""
        }
    },
    /**
     * 当需要启用 websocket 时，这个是必选项。
     */
    server?: Server,
    /**
     * 用于 websocket 消息处理的选项，如果启用了 websocket , 这个选项是必须的。
     */
    websocket?: {
        /**
         * 找到并读取完 mock 文件后，数据经过此函数处理后返回给前端页面
         * 当查找或读取文件发生错误时，第一个参数指定了具体的错误信息
         * 当 mock 文件是 json 时，第二个参数收到的是 json 对象
         * 当 mock 文件时其它文件时，第二个参数收到的是 Buffer 对象
         * 注意：由于 `websocket.send()` 方法仅支持发送 string, Buffer, TypedArray 等
         * 因此你有必要处理好返回的数据
         * 第三个参数是收到本次消息事件后 decodeMessage() 返回的结果
         */
        encodeMessage(error: Error, msg: Buffer|Object, decodedMsg): any;
        /**
         * 收到来自前端页面的消息后，数据经过此函数处理并返回对应的 url,
         * 服务器将此 url 映射为本地 mock 文件
         * 也可以返回一个对象：{url: string, args: any}, args 表示插件上下
         * 文环境对象里面的 args
         */
        decodeMessage(json: any): string | {url: string, args: any};
    },
    /**
     * 当收到的请求包含 X-Mock-Proxy 头时，请求将被转发到该头所指向的服务器，前端可以
     * 在请求拦截器里面动态的指定此头，达到在真假服务器切换的目标。
     */
    proxy?: {
        /**
         * 转发并获取到后端响应的数据后，如果指定了此选项，将数据保存为本地 mock 文件
         * 默认为 false
         */
        autoSave: boolean,
        /**
         * 此选项指定将数据保存为本地 mock 文件时，保存到哪个目录，一般和 mockrc.json
         * 里面 dir 字段一样。
         */
        saveDirectory: string,
        /**
         * 此选项指定将数据保存为本地 mock 文件时，如果要保存的文件已经存在将如何处理
         * 目前支持的选项为 "rename", "override"
         * 注意：如果你的前端代码里面存在大量轮训，建议使用 override
         */
        overrideSameFile: "rename" | "override"
    }
}

declare function localHttpMock(options: MockOptions): RequestHandler;

declare namespace localHttpMock {
    export function bindWebpack (app: Application, server: Server, options: MockOptions);
}
