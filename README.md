# local-http-mock

[![Build Status](https://travis-ci.com/mystorp/local-http-mock.svg?branch=master)](https://travis-ci.com/mystorp/local-http-mock)
[![Coverage Status](https://coveralls.io/repos/github/mystorp/local-http-mock/badge.svg?branch=master)](https://coveralls.io/github/mystorp/local-http-mock?branch=master)

这是又一个提供给前端使用的 http mock 库。

原理其实很简单：前端开发的过程中，启动一个 http 服务器，这个服务器接收来自前端页面的 ajax 请求，并将请求映射为本地 json 文件，然后返回 json 文件的内容给前端页面。这种开发方式可以让前端开发完全的自给自足而不需要依赖后端。不同于其它类似的项目，我们尝试提供更多的功能：

_注意：上面提到的“本地 json 文件”，代码里面称为假数据文件或者 mock 文件。_

* json 文件支持 [mockjs](http://mockjs.com/examples.html) 语法,  [json5](https://json5.org/) 语法
* 支持将 websocket onmessage 事件映射到本地 mock 文件
* 支持无重启代理后端服务器，支持将代理的后端服务器内容保存为本地 mock 文件
* 支持任意文件的 mock
* 支持任意 http 方法和任意 url 格式
* 支持请求延时，杀掉请求等
* 无缝对接 webpack-dev-server, express 等

## 安装
```bash
npm i -D local-http-mock
```
或者
```bash
yarn add -D local-http-mock
```

## 使用
### mockrc.json
mockrc.json 指定了 url 和 本地 mock 目录的对应关系，如：
```json
{
    "/v1": ".data/v1",
    "/v2": ".data/v2",
    "/ws": {
        "type": "websocket",
        "dir": ".data/websocket"
    }
}
```
上面的配置说明：
所有 url 前缀为 `/v1` 的 http 请求在 `.data/v1` 目录查找 mock 文件，
所有 url 前缀为 `/v2` 的 http 请求在 `.data/v2` 目录查找 mock 文件。
在 url `/ws` 上监听 websocket 请求，并在收到 `onmessage` 事件后将收到的数据映射为 url, 然后在 `.data/websocket` 目录查找 mock 文件。

local-http-mock 初始化时会在当前目录查找 `mockrc.json` 文件，如果找不到则读取 `package.json` 的 `mock` 字段，如果还没找到，就默认为：
```json
{
    "/": ".data"
}
```
即：所有的 http 请求都在 `.data` 目录中查找 mock 文件。
### 如何查找 mock 文件？
我们先讲 http 请求的查找过程。

当 local-http-mock 收到 http 请求时，首先将请求 url 分割为两部分：目录 + 文件。下面是一个例子：
```
// 收到
GET /groups/23/user/11/score
// 分割为
目录： /groups/23/user/11
文件： score
```
然后，以 .data 为根目录，逐级验证 groups/23/user/11 是否存在：
```
.data/groups
.data/groups/23
.data/groups/23/user
.data/groups/23/user/11
```
如果上面每一个目录都是存在的，则进行下一步，如果某个目录不存在，则查找失败，前端页面将收到 404。

通常来说，url 中的某些部分没有必要硬编码为目录名，比如 `.data/groups/23`， 23 仅仅代表数据库里面的 id，它可以是任何整数，如果我们写死为 23 那么就只能匹配 23 这个 group，如果我们要 mock 这个 url 路径，这个做法显然是很愚蠢的。

local-http-mock 允许对整数做特殊处理，像这样：`[number]`。如果目录名是 `[number]` 就表示这个目录名可以匹配任何整数，这样，上面的匹配过程将变成这样：
```
.data/groups
.data/groups/23 => .data/groups/[number]
.data/groups/23/user
.data/groups/23/user/11 => .data/groups/23/user/[number]
```
`=>` 表示如果左边的 url 路径匹配失败，则尝试右边的 url 路径。可以看到，这种方式通过对 url 中的某些部分模糊化，达到了通用匹配的目的。

local-http-mock 支持下面的模糊匹配：

|模式|示例|
|-|-|
|`[number]`|1, 32, 3232|
|`[ip]`|127.0.0.1, 192.168.1.134|
|`[email]`|xx@yy.com|
|`[uuid]`|45745c60-7b1a-11e8-9c9c-2d42b21b1a3e|

一个 url 里面可以有任意多个模糊匹配，如果请求 url 里面的目录部分全部匹配成功，则开始匹配文件名部分。匹配文件名时首先将目录下面所有的文件都列出来，然后使用下面的格式进行匹配：
```
<method>-<filename><.ext>
```
匹配的结果如果多余 1 个，优先使用以请求方法为前缀的文件，如：
```
GET /groups/23/user/11/score
优先匹配的文件名是：get-score
```
文件名后缀并不作为判断依据，如果一个 url 同时匹配了几个文件，除了请求方法为前缀的文件外，其它文件的优先级是一样的，谁是第一个优先使用谁，不过这种情况应该很少，不需要考虑。

上面就是收到 http 请求时的匹配过程， websocket 的匹配过程基本一致，但与 http 不同的是，websocket 并不存在 url 一说，当我们收到 onmessage 事件时，我们收到的可能是任意格式的数据，它们不是 url，因此在 local-http-mock 初始化时提供了将收到的数据转换为 url 的选项：
```javascript
const localHttpMock = require("local-http-mock");
localHttpMock({
    server: currentServer,
    websocket: {
        // 收到的数据为 json，将其中的字段组合为 url
        // 具体如何组合取决于你的业务逻辑实现
        decodeMessage: function(msg){
            msg = JSON.parse(msg);
            return `/${msg.type}/${msg.method}`;
        }
    }
});
```
websocket 收到 onmessage 事件并将收到的数据解析为 url 后，剩下的过程就和 http 一致了。

### API
`localHttpMock(options)`

`options` 参考下面的 [`MockOptions`](#mock-options)

返回：兼容 express middleware 的函数，它接收 `(request, response, next)` 3 个参数。

`localHttpMock.bindWebpack(app, devServer, options)` 由于 webpack 有自己的初始化逻辑，所以为 webpack 单独封装了一个函数调用。

`app` [express application object](https://expressjs.com/en/4x/api.html#app). webpack.config.js 里面 [`devServer.before`](https://webpack.js.org/configuration/dev-server#devserverbefore), [`devServer.after`](https://webpack.js.org/configuration/dev-server#devserverafter) 收到的第一个参数就是这里的 `app`.

`devServer` webpack-dev-server 启动时，允许 webpack.config.js 里面 `devServer.before`, `devServer.after` 等获取到 devServer 对象，通常是 this 引用，在较新的版本里面，webpack-dev-server 提供了第二个参数用于获取 devServer

`options` 参考下面的 [`MockOptions`](#mock-options)

无返回

<a name="mock-options"></a>
```typescript
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
         * local-http-mock 将此 url 映射为本地 mock 文件
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
```

## local-http-mock 如何支持请求延时，杀掉请求？
local-http-mock 查找到 mock 文件后，如果文件是 json 或者是 json5 类型，先将其解析为 json 对象，然后在 json 对象中查找特殊的指令，这些指令实现了延时，杀掉请求等功能。下面是一些例子：
```
GET /directive/delay
查找到的文件内容为 {"#delay#": 1000, ...} 则请求延时 1000 毫秒
GET /directive/kill
查找到的文件内容为 {"#kill#": true, ...} 则杀掉请求，如果同时指定了 `#delay#`, `#delay#` 优先
GET /directive/code
查找到的文件内容为 {"#code#": 408, ...} 则请求响应码为 408
```
