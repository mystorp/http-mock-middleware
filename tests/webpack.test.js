const fs = require("fs");
const path = require("path");
const axios = require("axios");
const webpack = require("webpack");
const webpackDevServer = require("webpack-dev-server");
const localHttpMock = require("../");
const rimraf = require("rimraf");
const WebSocket = require("ws");

const mockDirectoryPrefix = "tests/.data/webpack";
const mockFile = require("./utils").mockFile.bind(this, mockDirectoryPrefix);

let devServer;
beforeAll(function(done){
    mockFile("/index.js", "console.log('hello, local-http-mock')");
    let compiler = webpack({
        mode: "development",
        watch: false,
        entry: path.resolve(mockDirectoryPrefix, "index.js"),
        output: {
            path: path.resolve(mockDirectoryPrefix, "dist")
        }
    });
    devServer = new webpackDevServer(compiler, {
        lazy: true,
        filename: "[name].js",
        after: function(app, server){
            localHttpMock.bindWebpack(app, server || this, {
                websocket: {
                    // send base64
                    encodeMessage: function(error, msg){
                        if(error) {
                            msg = Buffer.from("Error: " + error.message);
                        } else if(!(msg instanceof Buffer)) {
                            msg = Buffer.from(JSON.stringify(msg));
                        }
                        return msg.toString("base64");
                    },
                    // receive json
                    decodeMessage: function(msg){
                        msg = JSON.parse(msg);
                        return "/" + msg.type + "/" + msg.method;
                    }
                }
            });
        }
    });
    devServer.listen(18080, "127.0.0.1", done);
    fs.writeFileSync("mockrc.json", JSON.stringify({
        "/": mockDirectoryPrefix,
        "/ws": {
            type: "websocket",
            dir: mockDirectoryPrefix + path.sep + "ws"
        }
    }));
});
afterAll(function(done){
    rimraf.sync(mockDirectoryPrefix);
    if(fs.existsSync("mockrc.json")) {
        fs.unlinkSync("mockrc.json");
    }
    devServer.close(() => done());
});

describe("webpack test", function(){
    test("http works well", function(){
        let data = "hello local-http-mock";
        mockFile("/hello/local-http-mock", data);
        return expect(
            axios.get("http://127.0.0.1:18080/hello/local-http-mock").then(resp => resp.data)
        ).resolves.toBe(data);
    });
    test("websocket works well", function(done){
        let socket = new WebSocket("ws://127.0.0.1:18080/ws");
        let msg = JSON.stringify({aa: 32, hello: "world!"});
        socket.on("open", function(){
            mockFile("/ws/file/my.json", msg);
            socket.send(JSON.stringify({type: "file", method: "my"}));
        });
        socket.on("message", function(e){
            expect(e).toBe(Buffer.from(msg).toString("base64"));
            socket.close();
            done();
        });
    });
});
