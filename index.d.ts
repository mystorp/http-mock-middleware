import { Server } from "http";

interface MockOptions {
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
         * 注意：由于 `websocket.send()` 方法仅支持发送 string, Buffer 等
         * 因此你有必要处理好返回的数据
         */
        encodeMessage(error: Error, msg: Buffer|Object): any;
        /**
         * 收到来自前端页面的消息后，数据经过此函数处理并返回对应的 url,
         * 服务器将此 url 映射为本地 mock 文件
         */
        decodeMessage(json: any): string;
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
         */
        overrideSameFile: "rename"
    }
}