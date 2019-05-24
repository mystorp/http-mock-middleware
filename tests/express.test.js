const fs = require("fs");
const path = require("path");
const express = require("express");
const axios = require("axios");
const localHttpMock = require("../");
const WebSocket = require("ws");
const rimraf = require("rimraf");

afterAll(function(){
    rimraf.sync("./tests/.data");
});

describe("http mock test", function(){
    let currentApp, currentServer, currentBaseUrl;
    beforeEach(function(done){
        currentApp = express();
        currentApp.use(localHttpMock());
        currentServer = currentApp.listen(function(){
            let addr = currentServer.address();
            currentBaseUrl = "http://127.0.0.1:" + addr.port;
            done();
        });
    });
    
    afterEach(function(){
        currentServer.close();
        currentApp = currentServer = currentBaseUrl = null;
    });

    test("GET /users/22/assets", function(){
        let jsonText = JSON.stringify({a: 32, b: 32});
        mockFile("tests/.data/users/[number]/assets", jsonText);
        return expect(
            axios.get(`${currentBaseUrl}/users/22/assets`)
            .then(resp => JSON.stringify(resp.data))
        ).resolves.toBe(jsonText);
    });
    test("GET / via X-Mock-Proxy", function(){
        console.log(JSON.stringify(currentBaseUrl));
        return expect(axios.get(`${currentBaseUrl}/`, {
            headers: {
                "X-Mock-Proxy": "http://www.baidu.com"
            }
        }).then(resp => resp.data)).resolves.toMatch(/百度一下，你就知道/);
    });
});
describe("websocket mock test", function(){
    let currentApp, currentServer, currentBaseUrl;
    beforeEach(function(done){
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
    
    afterEach(function(){
        currentServer.close();
        currentApp = currentServer = currentBaseUrl = null;
    });

    test("one message", function(done){
        let socket = new WebSocket(currentBaseUrl + "/ws");
        let msg = ("" + Math.random()).substring(2);
        socket.on("open", function(){
            mockFile("tests/.data/user/get", msg);
            socket.send(JSON.stringify({type: "user", method: "get"}));
        });
        socket.on("message", function(e){
            expect(e).toBe(Buffer.from(msg).toString("base64"));
            socket.close();
            done();
        });
    });
});

function mockFile(file, content) {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, content);
}