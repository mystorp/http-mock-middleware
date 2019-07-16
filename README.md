# http-mock-middleware

[![Build Status](https://travis-ci.com/mystorp/http-mock-middleware.svg?branch=master)](https://travis-ci.com/mystorp/http-mock-middleware)
[![Coverage Status](https://coveralls.io/repos/github/mystorp/http-mock-middleware/badge.svg?branch=master)](https://coveralls.io/github/mystorp/http-mock-middleware?branch=master)

一个强大、方便的 http mock 库。

## 目录

* [介绍](#introduction)
* [特性](#features)
* [安装](#installation)
* [API](#api)
* [文档](#documentation)
  * [http-mock-middleware 是如何工作的？](how-is-http-mock-middleware-work)
  * [配置文件 mockrc.json](#mockrc-json)
  * [如何查找 mock 文件？](#how-to-find-a-mock-file)
  * [插件和指令](#plugins-and-directives)
    * [cookies](#plugin-cookies)
    * [headers](#plugin-headers)
    * [if](#plugin-if)
    * [变量替换](#plugin-var-expansion)
    * [delay](#plugin-delay)
    * [status code](#plugin-status-code)
    * [ws-notify](#plugin-ws-notify)
    * [mockjs](#plugin-mockjs)
  * [websocket](#websocket)
  * [动态后端代理](#proxy)
* [FAQ](#faq)
* [TODO](#todo)
* [LICENSE](#license)


<a name="introduction"></a>

## 介绍

http-mock-middleware 是一个 http mock 库，或者说 ajax/websocket mock 库，它接收来自 web 前端页面的 ajax/websocket 请求，将请求映射到本地 mock 文件并经过一系列插件处理后返回给 web 前端页面。http-mock-middleware 内建了多个插件以实现各种各样的功能，比如：根据 query 参数等的不同响应不同的数据，按需将请求转发给后端服务器，延迟响应，设置 cookie，主动向 websocket 客户端发送数据等。

什么是本地 mock 文件？就是用于存放对应请求的假数据文件，比如要将请求 `/login` 映射为本地假数据文件 `.data/login.json`，就称 `.data/login.json` 为 mock 文件。

http-mock-middleware 本身导出为一个兼容 express middleware 的函数，因此你可以很方便的集成到 webpack-dev-server, vue-cli-service, express 等现有服务器中。
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
npm i -D hm-middleware
```
或者
```
yarn add -D hm-middleware
```

http-mock-middleware 暴露了一个简单的服务器命令: `http-mock-server`，让你可以无需任何配置即可快速的得到一个 mock server，所以，如果你觉得方便的话可以使用全局安装的方式：
```
npm i -g hm-middleware
```
<a name="api"></a>

## API

### `middleware(options)`

返回：兼容 express middleware 的函数，它接收 `(request, response, next)` 3 个参数。

* `options` 初始化选项
  * `.mockRules` mock 规则，如果指定了此选项，则忽略 mockrc.json，写法参考 [mockrc.json](#mockrc-json)
  * `.cors` 是否跨域，默认为 true。也可以是一个 [cors middleware 接受的配置对象](https://github.com/expressjs/cors#configuration-options)
  * `.parseBody` 是否解析请求 body，默认为 true。也可以是一个 [body-parser 接受的配置对象](https://github.com/expressjs/body-parser)
  * `.parseCookie` 是否解析请求 cookie，默认为 true。也可以是一个 [cookie-parser 接受的配置对象](https://github.com/expressjs/cookie-parser)
  * `.server` `http.Server` 对象，当需要启用 websocket 时，这个是必选项。
  * `.websocket` 用于 websocket 消息处理的选项，如果启用了 websocket , 这个选项是必须的。
    * `.decodeMessage` 函数。收到 websocket 消息后，需要将消息对象先映射为 url，再映射为本地 mock 文件。这个函数用于将消息对象解析为 url，这个函数也可以返回一个对象：`{url: string: args: any}`，args 表示要传递给插件上下文 args 的数据。
    * `.encodeMessage` 函数。处理完本地 mock 文件后，需要将生成的内容转换为 websocket 客户端可以理解的消息格式。它接受三个参数：`(error, data, decodedMsg)`。如果在处理本地 mock 文件的过程中发生任何错误，error 被设置为该错误，此时 data 为空；如果处理过程成功，则 data 对象被设置为最终的生成数据，此时 error 为空。注意：如果映射的本地 mock 文件是 json，则 data 对象为 json 对象，如果映射的是非 json 对象，则 data 对象为包含文件内容的 Buffer 对象；由于 `websocket.send()` 方法仅仅接受 `String`, `Buffer`, `TypedArray` 等对象，因此你有必要返回正确的数据。第三个参数表示收到本次消息事件后 decodeMessage() 返回的数据。
  * `.proxy` 当收到的请求包含 X-Mock-Proxy 头时，请求将被转发到该头所指向的服务器 url
    * `.autoSave` 是否自动将代理的内容保存为本地 mock 文件，默认为 false
    * `.saveDirectory` 如果需要自动保存，这个选项指定保存的目录，一般使用 mockRules 配置的 dir 就可以了。
    * `.overrideSameFile` 当自动保存时，如果发现文件已经存在，此选项指定如何处理。`rename` 现有文件被重命名，`override` 现有文件被覆盖。

使用方法：
```js
// webpack.config.js
const middleware = require("http-mock-middleware");

module.exports = {
    devServer: {
        after: function(app){
            // 如果仅仅使用 http mock，这样写就可以了
            app.use(middleware(options));
            // 如果需要支持 websocket，需要使用下面的提供 API
        }
    }
};
```

### `middleware.bindWebpack(app, devServer, options)`
如果你需要使用 websocket + webpack，才需要使用此 API。

* `app` [express Application 对象](https://expressjs.com/en/4x/api.html#app)
* `devServer` webpack-dev-server 启动时，允许 webpack.config.js 里面 `devServer.before`, `devServer.after` 等获取到 devServer 对象，通常是 this 引用，在较新的版本里面，webpack-dev-server 提供了第二个参数用于获取 devServer
* `options` 参考 `middleware(options)` 里面的 options

使用方法：
```js
// webpack.config.js
const middleware = require("http-mock-middleware");

module.exports = {
    devServer: {
        after: function(app, server){
            middleware(app, server || this, options)
        }
    }
};
```
<a name="documentation"></a>

## 文档
<a name="how-is-http-mock-middleware-work"></a>

### http-mock-middleware 是如何工作的？
http-mock-middleware 按照如下顺序工作：

1. 收到请求，将请求 url 和 mockrc.json 指定的规则进行匹配
2. 使用匹配的规则将 url 映射为本地 mock 文件并获取文件内容
3. 将文件内容丢给插件处理
4. 返回生成的数据

注意：如果在初始化时指定了 `mockRules` 参数，则 http-mock-middleware 忽略查找 mockrc.json。
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


http-mock-middleware 初始化时会在当前目录查找 `mockrc.json` 文件，如果找不到则读取 `package.json` 的 `mock` 字段，如果还没找到，就默认为：
```json
{
    "/": ".data"
}
```
即：所有的 http 请求都在 `.data` 目录中查找 mock 文件。
<a name="how-to-find-a-mock-file"></a>

### 如何查找 mock 文件？
当 http-mock-middleware 收到 http 请求时，首先将请求 url 分割为两部分：目录 + 文件。下面是一个例子：
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

http-mock-middleware 允许对整数做特殊处理，像这样：`[number]`。如果目录名是 `[number]` 就表示这个目录名可以匹配任何整数，这样，上面的匹配过程将变成这样：
```
.data/groups
.data/groups/23 => .data/groups/[number]
.data/groups/23/user
.data/groups/23/user/11 => .data/groups/23/user/[number]
```
`=>` 表示如果左边的 url 路径匹配失败，则尝试右边的 url 路径。可以看到，这种方式通过对 url 中的某些部分模糊化，达到了通用匹配的目的。

http-mock-middleware 支持下面的模糊匹配：

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

上面就是收到 http 请求时的匹配过程， websocket 的匹配过程基本一致，但与 http 不同的是，websocket 并不存在 url 一说，当我们收到 onmessage 事件时，我们收到的可能是任意格式的数据，它们不是 url，因此在 http-mock-middleware 初始化时提供了将收到的数据转换为 url 的选项：
```javascript
const middleware = require("http-mock-middleware");
middleware({
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

查找到本地 mock 文件后，文件内容和一些请求参数会丢给插件处理。
<a name="plugins-and-directives"></a>

### 插件和指令
插件是一段有特殊功能的代码，如可能是设置 http 头，可能是解析 json 内特殊标记等。插件被设计为是可插拔的，因此新增插件是很容易的。插件运行时接受一个共享的上下文环境对象。

注意：插件仅仅对 json 或 json5 文件生效。

http-mock-middleware 将多个核心功能丢给插件来完成。比如需要为 response 设置 http 头时，headers 插件就会在 json 文件内容里面查找 `#headers#` 指令，并将指令的内容设置到 http 头。

指令是插件可识别的特殊 json 键名，指令默认使用 `#<name>#` 格式命名，这是为了避免和 json 键名冲突，指令的值就是对应的键值。

http-mock-middleware 支持的插件和指令如下：

<a name="plugin-cookies"></a>

#### cookies 插件

支持的指令： `#cookies#`

cookies 插件的主要功能是为 response 设置 cookie http 头。

`#cookies#` 的值为对象或者对象数组，如果你希望对 cookie 做更为精细的控制，则需要使用对象数组的形式。

假设 http 请求 `GET /x` 匹配的本地 mock 文件为 `.data/x.json`，当使用了 `#cookies#` 指令后：
```js
// file: .data/x.json
{
    // 对象形式
    "#cookies#": {a: 3, b: 4}
    // 也可以是对象数组的形式
    // "#cookies#": [{name: a, value: 3, options: {path: "/"}}]
}
```
响应的 http 头包括：
```
Set-Cookie: a=3
Set-Cookie: b=4
```
如果希望使用对象数组的格式，请参考 [express response.cookie()](http://expressjs.com/en/4x/api.html#res.cookie)
<a name="plugin-headers"></a>

#### headers 插件

支持的指令： `#headers#`

headers 插件的主要功能是为 response 设置自定义 http 头，除此之外，它为每个 response 添加了一个 `X-Mock-File` 头用以指向当前请求匹配到的本地 mock 文件，如果本地 mock 文件是 json ，则主动添加 `Content-Type: application/json`。

`#headers#` 的值为对象。

假设 http 请求 `GET /x` 匹配的本地 mock 文件为 `.data/x.json`，当使用了 `#headers#` 指令后：
```js
// file: .data/x.json
{
    "#headers#": {'my-header1': 3, 'my-header2': 4}
}
```
响应的 http 头包括：
```
my-header1: 3
my-header2: 4
```
<a name="plugin-if"></a>

#### if 插件
支持的指令： `#if#`, `#default#`, `#args#`

if 插件的主要功能是根据请求参数条件响应，请求参数如下：
```
query          请求 url 中的查询字符串构成的对象，即 request.query
body           请求体，如过请求体是 json，则 body 为 json 对象，即 request.body
headers        请求头对象，包含了当前请求的所有 http 头，即 request.headers
cookies        当前请求所附带的 cookie 信息，是一个对象，即 request.cookies
signedCookies  当前请求所附带的加密 cookie 信息，是一个对象，即 request.signedCookies
args           #args# 指令的值
env            当前环境变量对象，即 process.env
```
`#if#` 指令的使用形式为：`#if:<code>#`，code 是一段任意的 javascript 代码，它运行在一个以请求参数为全局对象的沙盒里，当这段代码求值结果为真值，则表示使用它的值作为 response 内容，如果所有的 `#if#` 求值结果均为假值，则使用 `#default#` 指令的值，如果多个 `#if#` 指令求值结果为真值，默认取第一个 `#if#` 指令的值，看下面的例子：

假设 http 请求 `GET /x?x=b` 匹配的本地 mock 文件为 `.data/x.json`，当使用了 `#if#` 指令后：
```js
// file: .data/x.json
{
    "#if:query.x == 'a'#": {
        "result": "a"
    },
    "#if:query.x == 'b'#": {
        "result": "b"
    },
    "#default#": {
        "result": "none"
    }
}
```
response 的内容为：
```json
{"result": "b"}
```
<a name="plugin-var-expansion"></a>

#### 变量替换插件

支持的指令：`#args#`

变量替换插件主要的功能是遍历输出内容对象的值，将包含有变量的部分替换为变量对应的值，变量的声明格式为 `#$<var>#`，其中 var 就是变量名，变量名是一个或多个变量的引用链，如：`query`, `query.x`, `body.user.name`。

变量可引用的全局变量也是请求参数，同 `#if#` 指令一样。

默认情况，变量声明如果是字符串的一部分，则替换后的结果也是字符串的一部分，如果变量声明是一个字符串的全部，则使用替换后的值覆盖字符串值，看下面的例子：

假设有 http 请求 `POST /x?x=b`，其请求体为：
```json
{
    "x": "b",
    "y": [1, 2, 3]
}
```
匹配的本地 mock 文件为 `.data/x.json`：
```json
{
    "result": {
        "x": "#$body.x#",
        "y": "#$body.y#",
        "xy": "#$body.x##$body.y#"
    }
}
```
当经过变量替换后，内容如下：
```json
{
    "result": {
        "x": "b",
        "y": [1, 2, 3],
        "xy": "b1,2,3"
    }
}
```

<a name="plugin-delay"></a>

#### delay 插件
支持的指令： `#delay#`

delay 插件的主要功能是延迟 response 结束的时间。

`#delay#` 的值是一个整数，它表示延迟的毫秒值。
<a name="plugin-status-code"></a>
#### status code 插件
支持的指令： `#code#`, `#kill#`

status code 插件的主要功能是设置 response 状态码。

`#code#` 的值是一个有效的 http 状态码整数。

`#kill#` 的值是一个布尔值，它表示是否杀掉请求，杀掉请求后，后续的插件不会被调用。
<a name="plugin-ws-notify"></a>

#### ws-notify 插件
支持的指令： `#notify#`

**注意：该插件仅对 websocket 生效**

ws-notify 插件的主要功能是经过固定延迟时间后主动发起一个服务器端 websocket 消息

`#notify#` 的值 value 如果是字符串，等同于 `[{url: value, delay: 0}]`
`#notify#` 的值 value 如果是对象，等同于 `[value]`
`#notify#` 的值 value 如果是对象数组，则为数组中的每一项创建一个 delay 毫秒后解析并发送 url 指向的本地 mock 文件的服务器端 websocket 消息任务

<a name="plugin-mockjs"></a>

#### mockjs 插件

mockjs 插件的主要功能是为 json 内容提供数据模拟支持，mockjs 的语法请参考[这里](http://mockjs.com/examples.html)

<a name="websocket"></a>

### websocket
如果你希望在 url 上使用 websocket ，务必要在 mock 规则里面为 url 添加 `"type": "websocket"`，否则无法生效。

由于 websocket 收发消息没有统一的标准，可以是二进制，也可以是字符串，http-mock-middleware 无法准确的知道消息格式，因此你有必要告诉 http-mock-middleware 如何解析、封装你的 websocket 消息。参考 API 获取有关配置的详细信息。

<a name="proxy"></a>

### 动态后端代理
在前端开发阶段，有 mock 数据支持就够了，在前后端联调过程中，后端服务器的数据更真实，mock 数据反而不那么重要了。因此在必要的时候将数据代理到后端服务器就显得很有必要了。

http-mock-middleware 主要通过 `X-Mock-Proxy` 头来判断是否需要代理，下面使用 axios 库演示如何使用 localStorage 控制动态代理：
```js
const axios = require("axios");

axios.interceptors.request.use(function(config){
    if(process.env.NODE_ENV === "development") {
        let mockHeader = localStorage.proxyUrl;
        if(mockHeader) {
            config.headers = config.headers || {};
            config.headers["X-Mock-Proxy"] = mockHeader;
        }
    }
    // other code
    return config;
});
```

使用上面的代码，开发时不设置 `localStorage.proxyUrl` 使用假数据，联调时设置 `localStorage.proxyUrl` 指向后端服务器使用真数据。

**注意：`X-Mock-Proxy` 的值是一个 url, 因为 http-mock-middleware 无法确定你的服务器是不是 https。通常你需要只设置为 `http://host:port/` 就可以了**

<a name="faq"></a>

## FAQ
我觉得我已经很啰嗦了，先空着。

<a name="todo"></a>

## TODO
* 添加更多插件，比如添加运行在沙盒的 js 插件？
* 变量替换获取更多的数据源，如：git 分支名称？
* 让数据关联起来
* 每个 url 有成功、失败等状态，添加一个 web 小工具，可以让用户动态选择使用哪个文件作为 url 的默认文件

<a name="license"></a>

## LICENSE

The MIT License (MIT)

Copyright (c) 2019 593233820@qq.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
