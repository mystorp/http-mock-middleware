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

    test("mock json file will read and parse", function(done){
        let socket = new WebSocket(currentBaseUrl + "/ws");
        let msg = JSON.stringify({aa: 32, hello: "world!"});
        socket.on("open", function(){
            mockFile("/file/my.json", msg);
            socket.send(JSON.stringify({type: "file", method: "my"}));
        });
        socket.on("message", function(e){
            expect(e).toBe(Buffer.from(msg).toString("base64"));
            socket.close();
            done();
        });
    });
    test("mock json file support #delay# directive", function(done){
        let socket = new WebSocket(currentBaseUrl + "/ws");
        let msg = JSON.stringify({"#delay#": 1000, hello: "world!"});
        let start;
        socket.on("open", function(){
            mockFile("/file/my.json", msg);
            start = Date.now();
            socket.send(JSON.stringify({type: "file", method: "my"}));
        });
        socket.on("message", function(e){
            expect(Date.now() - start).toBeGreaterThan(1000);
            socket.close();
            done();
        });
    });
    test("mock invalid json file will throw", function(done){
        let socket = new WebSocket(currentBaseUrl + "/ws");
        let msg = "invalid json";
        socket.on("open", function(){
            mockFile("/file/my.json", msg);
            socket.send(JSON.stringify({type: "file", method: "my"}));
        });
        socket.on("message", function(e){
            expect(Buffer.from(e, "base64").toString()).toMatch(/^Error: /);
            socket.close();
            done();
        });
    });
    test("mock valid file will work", function(done){
        let socket = new WebSocket(currentBaseUrl + "/ws");
        let msg = "valid file";
        socket.on("open", function(){
            mockFile("/file/data", msg);
            socket.send(JSON.stringify({type: "file", method: "data"}));
        });
        socket.on("message", function(e){
            expect(e).toBe(Buffer.from(msg).toString("base64"));
            socket.close();
            done();
        });
    });
    // TODO: get this done
    /*
    test("mock invalid file will throw", function(done){
        let socket = new WebSocket(currentBaseUrl + "/ws");
        let msg = "";
        socket.on("open", function(){
            mockFile("/file/some/file", msg);
            socket.send(JSON.stringify({type: "file", method: "some"}));
        });
        socket.on("message", function(e){
            expect(Buffer.from(e, "base64")).toMatch(/^Error: /);
            socket.close();
            done();
        });
    });
    */
});
