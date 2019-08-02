const WebSocket = require("ws");
const isPlainObject = require("is-plain-object");
const { setup, createServer } = require("./utils");
const mockDirectoryPrefix = "tests/.data/websocket";
const mockFile = setup(mockDirectoryPrefix);


describe("websocket mock test", function(){
    let server, baseurl;
    let setupSocketIsCalled = false;
    beforeAll(function(done){
        createServer({
            mockRules: {
                "/ws": {
                    type: "websocket",
                    dir: mockDirectoryPrefix
                }
            },
            websocket: {
                setupSocket: function(){
                    setupSocketIsCalled = true;
                },
                // send base64
                encodeMessage: function(error, msg){
                    if(error) {
                        msg = Buffer.from("Error: " + error.message);
                    } else {
                        if(isPlainObject(msg)) {
                            msg = Buffer.from(JSON.stringify(msg));
                        } else if(!Buffer.isBuffer(msg)) {
                            msg = new Buffer(msg);
                        }
                    }
                    return msg.toString("base64");
                },
                // receive json
                decodeMessage: function(msg){
                    msg = JSON.parse(msg);
                    msg.url = `/${msg.type}/${msg.method}`;
                    return msg;
                }
            }
        }, function(args){
            ({axios, server} = args);
            baseurl = "ws://" + args.host + ":" + args.port;
            done();
        });
    });
    
    afterAll(function(){
        server.close();
    });

    test("setupSocket option will be called", function(done){
        let socket = new WebSocket(baseurl + "/ws");
        let msg = JSON.stringify({aa: 32, hello: "world!"});
        socket.on("open", function(){
            mockFile("/file/my1.json", msg);
            socket.send(JSON.stringify({type: "file", method: "my1"}));
        });
        socket.on("message", function(e){
            expect(setupSocketIsCalled).toBe(true);
            socket.close();
            done();
        });
    });

    test("mock json file will read and parse", function(done){
        let socket = new WebSocket(baseurl + "/ws");
        let msg = JSON.stringify({aa: 32, hello: "world!"});
        socket.on("open", function(){
            mockFile("/file/my1.json", msg);
            socket.send(JSON.stringify({type: "file", method: "my1"}));
        });
        socket.on("message", function(e){
            expect(Buffer.from(e, "base64").toString()).toBe(msg);
            socket.close();
            done();
        });
    });
    test("mock json file support #delay# directive", function(done){
        let socket = new WebSocket(baseurl + "/ws");
        let msg = JSON.stringify({"#delay#": 1000, hello: "world!"});
        let start;
        socket.on("open", function(){
            mockFile("/file/my2.json", msg);
            start = Date.now();
            socket.send(JSON.stringify({type: "file", method: "my2"}));
        });
        socket.on("message", function(e){
            expect(Date.now() - start).toBeGreaterThan(1000);
            socket.close();
            done();
        });
    });
    test("mock invalid json file will receive Buffer", function(done){
        let socket = new WebSocket(baseurl + "/ws");
        let msg = "invalid json";
        socket.on("open", function(){
            mockFile("/file/my3.json", msg);
            socket.send(JSON.stringify({type: "file", method: "my3"}));
        });
        socket.on("message", function(e){
            expect(Buffer.from(e, "base64").toString()).toBe(msg);
            socket.close();
            done();
        });
    });
    test("mock valid file will work", function(done){
        let socket = new WebSocket(baseurl + "/ws");
        let msg = "valid file";
        socket.on("open", function(){
            mockFile("/file/data", msg);
            socket.send(JSON.stringify({type: "file", method: "data"}));
        });
        socket.on("message", function(e){
            expect(Buffer.from(e, "base64").toString()).toBe(msg);
            socket.close();
            done();
        });
    });
    test("mock file missing will fail", function(done){
        let socket = new WebSocket(baseurl + "/ws");
        socket.on("open", function(){
            socket.send(JSON.stringify({type: "file", method: "missing"}));
        });
        socket.on("message", function(e){
            expect(Buffer.from(e, "base64").toString()).toMatch(/^Error: /);
            socket.close();
            done();
        });
    });
    test("invalid websocket path will fail", function(done){
        let socket = new WebSocket(baseurl + "/wsx");
        socket.on("error", function(e) {
            expect(e.message).toBe("socket hang up");
            done();
        });
    });
    test("websocket support #notify#", function(done){
        let socket = new WebSocket(baseurl + "/ws");
        let i = 0, notifyStart;
        socket.on("open", function(){
            mockFile("/file/notify1.json", JSON.stringify({
                "#notify#": "/file/notify2.json",
                "from": "notify1"
            }));
            mockFile("/file/notify2.json", JSON.stringify({
                "#notify#": {
                    url: "/file/notify3.json",
                    delay: 500,
                    args: {from: "notify2"}
                },
                from: "notify2"
            }));
            mockFile("/file/notify3.json", JSON.stringify({from: "#$args.from#"}));
            socket.send(JSON.stringify({type: "file", method: "notify1"}));
        });
        socket.on("message", function(e){
            i++;
            let data = JSON.parse(Buffer.from(e, "base64").toString());
            if(i === 1) {
                expect(data).toEqual({from: "notify1"});
            } else if(i === 2) {
                expect(data).toEqual({from: "notify2"});
                notifyStart = Date.now();
            } else if(i === 3) {
                expect(data).toEqual({from: "notify2"});
                expect(Date.now() - notifyStart).toBeGreaterThan(500);
                socket.close();
                done();
            }
        });
    });
});
