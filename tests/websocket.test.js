const fs = require("fs");
const express = require("express");
const localHttpMock = require("../");
const WebSocket = require("ws");
const rimraf = require("rimraf");

const mockDirectoryPrefix = "tests/.data/websocket";
const mockFile = require("./utils").mockFile.bind(this, mockDirectoryPrefix);

beforeAll(function(){
    fs.writeFileSync("mockrc.json", JSON.stringify({
        "/ws": {
            type: "websocket",
            dir: mockDirectoryPrefix
        }
    }));
});
afterAll(function(){
    rimraf.sync(mockDirectoryPrefix);
    fs.unlinkSync("mockrc.json");
});

describe("websocket mock test", function(){
    let currentApp, currentServer, currentBaseUrl;
    beforeAll(function(done){
        currentApp = express();
        currentServer = currentApp.listen(function(){
            let addr = currentServer.address();
            currentBaseUrl = "ws://127.0.0.1:" + addr.port;
            currentApp.use(localHttpMock({
                server: currentServer,
                websocket: {
                    // send base64
                    encodeMessage: function(msg){
                        return Buffer.from(msg).toString("base64");
                    },
                    // receive json
                    decodeMessage: function(msg){
                        msg = JSON.parse(msg);
                        return `/${msg.type}/${msg.method}`;
                    }
                }
            }));
            done();
        });
    });
    
    afterAll(function(){
        currentServer.close();
        currentApp = currentServer = currentBaseUrl = null;
    });

    test("receive and send message correctly", function(done){
        let socket = new WebSocket(currentBaseUrl + "/ws");
        let msg = ("" + Math.random()).substring(2);
        socket.on("open", function(){
            mockFile("/user/get", msg);
            socket.send(JSON.stringify({type: "user", method: "get"}));
        });
        socket.on("message", function(e){
            expect(e).toBe(Buffer.from(msg).toString("base64"));
            socket.close();
            done();
        });
    });
});
