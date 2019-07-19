const path = require("path");
const axios = require("axios").create();
const webpack = require("webpack");
const webpackDevServer = require("webpack-dev-server");
const httpMockMiddleware = require("../");
const WebSocket = require("ws");
const { setup } = require("./utils");

const mockDirectoryPrefix = "tests/.data/webpack";
const mockFile = setup(mockDirectoryPrefix);

let devServer;
beforeAll(function(done){
    mockFile("/index.js", "console.log('hello, http-mock-middleware')");
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
            app.use(httpMockMiddleware({
                mockRules: {
                    "/": mockDirectoryPrefix,
                    "/ws": {
                        type: "websocket",
                        dir: mockDirectoryPrefix + path.sep + "ws"
                    }
                },
                websocket: {
                    server: server || this,
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
            }));
        }
    });
    devServer.listen(18080, "127.0.0.1", done);
});
afterAll(function(done){
    devServer.close(() => done());
});

describe("webpack test", function(){
    test("http works well", function(){
        let data = "hello http-mock-middleware";
        mockFile("/hello/http-mock-middleware", data);
        return expect(
            axios.get("http://127.0.0.1:18080/hello/http-mock-middleware").then(resp => resp.data)
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
