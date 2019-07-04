# local-http-mock

[![Build Status](https://travis-ci.com/mystorp/local-http-mock.svg?branch=master)](https://travis-ci.com/mystorp/local-http-mock)
[![Coverage Status](https://coveralls.io/repos/github/mystorp/local-http-mock/badge.svg?branch=master)](https://coveralls.io/github/mystorp/local-http-mock?branch=master)

一个强大、方便的 http mock 库。

## 目录

1. [介绍](#introduction)
2. [特性](#features)
3. [安装](#installation)
4. [API](#api)
5. [文档](#documentation)
6. [FAQ](#faq)
7. [TODO](#todo)


<a name="introduction"></a>
## 介绍

local-http-mock 是一个 http mock 库，或者说 ajax/websocket mock 库，它接收来自 web 前端页面的 ajax/websocket 请求，将请求映射到本地文件并经过一系列指令处理后返回给 web 前端页面。local-http-mock 内建了多种处理指令以实现各种各样的功能，比如：根据 query 参数等的不同响应不同的数据，按需将请求转发给后端服务器，延迟响应，设置 cookie，主动向 websocket 客户端发送数据等。

local-http-mock 本身导出为一个兼容 express middleware 的函数，因此你可以很方便的集成到 webpack-dev-server, vue-cli-service, express 等现有代码中。
<a name="features"></a>
## 特性

* 支持任意 http 方法和任意 url 格式
* 支持 mock 任意文件
* mock json 文件时，支持 [mockjs](http://mockjs.com/examples.html) 语法,  [json5](https://json5.org/) 语法
* mock json 文件时，支持根据 query, body, headers, cookie 等信息按需响应；
* mock json 文件时，支持设置 cookie、http 头、http 状态码
* mock json 文件时，支持响应延时，杀掉请求，请求数据引用
* 支持将 websocket onmessage 事件映射到本地 mock 文件
* 支持主动发送 websocket 消息
* 支持无重启代理后端服务器，支持将代理的后端服务器内容保存为本地 mock 文件
* 无缝对接 webpack-dev-server, vue-cli-service, express 等
<a name="installation"></a>
## 安装

```
npm i -D local-http-mock
```
或者
```
yarn add -D local-http-mock
```
<a name="api"></a>
## API

### `localHttpMock(options)`

返回：兼容 express middleware 的函数，它接收 `(request, response, next)` 3 个参数。

* `options` 初始化选项
  * `.mockRules` mock 规则，如果指定了此选项，则忽略 mockrc.json，写法参考 mockrc.json
  * `.cors` 是否跨域，默认为 true。也可以是一个 [cors middleware 接受的配置对象](https://github.com/expressjs/cors#configuration-options)
  * `.parseBody` 是否解析请求 body，默认为 true。也可以是一个 [body-parser 接受的配置对象](https://github.com/expressjs/body-parser)
  * `.parseCookie` 是否解析请求 cookie，默认为 true。也可以是一个 [cookie-parser 接受的配置对象](https://github.com/expressjs/cookie-parser)
  * `.server` `http.Server` 对象，当需要启用 websocket 时，这个是必选项。
  * `.websocket` 用于 websocket 消息处理的选项，如果启用了 websocket , 这个选项是必须的。
    * `.decodeMessage` 函数。收到 websocket 消息后，需要将消息对象先映射为 url，再映射为本地文件。这个函数用于将消息对象解析为 url
    * `.encodeMessage` 函数。处理完本地文件后，需要将生成的内容转换为 websocket 客户端可以理解的消息格式。它接受两个参数：`(error, data)`。如果在处理本地文件的过程中发生任何错误，error 被设置为该错误，此时 data 为空；如果处理过程成功，则 data 对象被设置为最终的生成数据，此时 error 为空。注意：如果映射的本地文件是 json，则 data 对象为 json 对象，如果映射的是非 json 对象，则 data 对象为包含文件内容的 Buffer 对象；由于 `websocket.send()` 方法仅仅接受 `String`, `Buffer`, `TypedArray` 等对象，因此你有必要返回正确的数据。
  * `.proxy` 当收到的请求包含 X-Mock-Proxy 头时，请求将被转发到该头所指向的服务器
    * `.autoSave` 是否自动将代理的内容保存为本地文件，默认为 false
    * `.saveDirectory` 如果需要自动保存，这个选项指定保存的目录，一般使用 mockRules 配置的 dir 就可以了。
    * `.overrideSameFile` 当自动保存时，如果发现文件已经存在，此选项指定如何处理。`rename` 现有文件被重命名，`override` 现有文件被覆盖。

使用方法：
```js
// webpack.config.js
module.exports = {
    devServer: {
        after: function(app){
            // 如果仅仅使用 http mock，这样写就可以了
            app.use(localHttpMock(options));
            // 如果需要支持 websocket，需要使用下面的提供 API
        }
    }
};
```

### `localHttpMock.bindWebpack(app, devServer, options)`
如果你需要使用 websocket ，才需要使用此 API。

* `app` [express Application 对象](https://expressjs.com/en/4x/api.html#app)
* `devServer` webpack-dev-server 启动时，允许 webpack.config.js 里面 `devServer.before`, `devServer.after` 等获取到 devServer 对象，通常是 this 引用，在较新的版本里面，webpack-dev-server 提供了第二个参数用于获取 devServer
* `options` 参考 `localHttpMock(options)` 里面的 options
<a name="documentation"></a>
## 文档
<a name="how-is-local-http-mock-work"></a>
### local-http-mock 是如何工作的？
local-http-mock 按照如下顺序工作：

1. 收到请求，将请求 url 和 mockrc.json 指定的规则进行匹配
2. 使用匹配的规则将 url 映射为本地文件并获取文件内容
3. 将文件内容丢给指令函数链
4. 返回生成的数据

注意：如果在初始化时指定了 `mockRules` 字段，则 local-http-mock 忽略查找 mockrc.json。
<a name="mockrc-json"></a>
### 配置文件 mockrc.json
mockrc.json 指定了 url前缀 和 本地 mock 目录的对应关系，如：
```json
{
    "/oa": ".data/oa-data",
    "/auth": ".data/auth-data",
    "/ws": {
        "type": "websocket",
        "dir": ".data/websocket"
    }
}
```
上面的配置说明：

所有 url 前缀为 `/oa/` 的 http 请求在 `.data/oa-data` 目录查找 mock 文件，如：请求 `GET /oa/version` 优先映射为 `.data/oa-data/oa/get-version`

所有 url 前缀为 `/auth/` 的 http 请求在 `.data/auth-data` 目录查找 mock 文件，如：请求 `POST /auth/login` 优先映射为 `.data/auth-data/auth/post-login`

在 url `/ws` 上监听 websocket 请求，并在收到 `onmessage` 事件后将收到的数据映射为 url, 然后在 `.data/websocket` 目录查找 mock 文件。

上面提到了优先映射，你可以在下一章节找到优先映射的含义。

注意：url 前缀在匹配时，默认认为它们是一个目录，而不是文件的一部分。如：`/oa` 表示 mock 目录下的 oa 目录，而不能匹配 `/oa-old`。


local-http-mock 初始化时会在当前目录查找 `mockrc.json` 文件，如果找不到则读取 `package.json` 的 `mock` 字段，如果还没找到，就默认为：
```json
{
    "/": ".data"
}
```
即：所有的 http 请求都在 `.data` 目录中查找 mock 文件。
<a name="how-to-find-a-mock-file"></a>
### 如何查找 mock 文件？
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

查找到本地文件后，文件内容和一些请求参数会丢给指令函数链处理。
<a name="directives"></a>
### 指令
指令是一段有特殊功能的代码，如可能是设置 http 头，可能是解析 json 内特殊标记等。指令被设计为是可插拔的，因此新增指令是很容易的。指令运行时接受一个共享的上下文环境对象。

注意：指令仅仅对 json 或 json5 文件生效。

local-http-mock 将多个核心功能丢给指令来完成。比如需要为请求设置 http 头时，该指令就会在 json 文件内容里面查找 `#headers#`，并将查找到的内容设置到 http 头。

local-http-mock 指令默认使用 `#<name>#` 格式命名，这是为了避免和 json 键名冲突。local-http-mock 默认支持的指令有：

* `#cookies#`
* `#headers#`
* `#if#`
* `#default#`
* `#args#`
* `#delay#`
* `#code#`
* `#kill#`
* `#notify#`

<a name="faq"></a>
## FAQ

### 为什么要使用 local-http-mock？
### 使用 local-http-mock 我能做到什么？