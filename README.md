# local-http-mock
这是又一个提供给前端使用的 http mock 库。原理其实很简单：前端开发的过程中，启动一个 http 服务器，这个服务器接收来自前端页面的 ajax 请求，并将请求映射为本地 json 文件，然后返回 json 文件的内容给前端页面。这种开发方式可以让前端开发完全的自给自足而不需要依赖后端。不同于其它类似的库，这个库尝试提供更多的功能：

_注意：上面提到的“本地 json 文件”，代码里面称为假数据文件或者 mock 文件。_

* json 文件支持 [mockjs](http://mockjs.com/examples.html) 语法,  [json5](https://json5.org/) 语法
* 支持将 websocket onmessage 事件映射到本地 mock 文件
* 支持无重启代理后端服务器，支持将代理的后端服务器内容保存为本地 mock 文件
* 支持任意文件的 mock
* 支持任意 http 方法和任意 url 格式
* 支持请求延时，杀掉请求等
* 无缝对接 webpack-dev-server express 等

## 安装
```bash
npm i --dev local-http-mock
```
或者
```bash
yarn add -D local-http-mock
```

## 使用
集成 express:
```javascript
const express = require("express");
const app = express();
const localHttpMock = require("local-http-mock");
app.use(localHttpMock());
```
集成 webpack-dev-server:
```javascript
const localHttpMock = require("local-http-mock");
// webpack.config.js
module.exports = {
    devServer: {
        after(app){
            localHttpMock.bindWebpack(app, this);
        }
    }
}
```
## 