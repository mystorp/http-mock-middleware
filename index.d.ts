import { Server } from "http";

interface MockOptions {
    /**
     * 当收到 X-Mock-Proxy 并获取到后端响应的数据后，如果指定了此选项，将数据保存为本地 mock 文件
     */
    saveProxyData: boolean;
    /**
     * 当需要启用 websocket 时，这个是必选项。
     */
    server?: Server,
    /**
     * 用于 websocket 消息处理的选项，如果启用了 websocket ,这个选项是必须的。
     */
    websocket?: {
        /**
         * 找到并读取完 mock 文件后，数据经过此函数处理后返回给前端页面
         */
        encodeMessage(msg: Buffer): string;
        /**
         * 收到来自前端页面的消息后，数据经过此函数处理并返回对应的 url,
         * 服务器将此 url 映射为本地 mock 文件
         */
        decodeMessage(json: any): any;
    }
}