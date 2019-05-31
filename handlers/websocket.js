const fs = require("fs");
const url = require("url");
const WebSocket = require("ws");
const MockFileManager = require("../MockFileManager");

module.exports = function(options, rules){
    let {server, websocket} = options;
    let websocketServers = {};
    rules.forEach(rule => {
        let {url, rootDirectory} = rule;
        websocketServers[url] = new WebSocket.Server({ noServer: true });
        websocketServers[url].on("connection", function(ws){
            ws.on("message", onMessageHandler.bind(ws, websocket, rootDirectory));
        });
    });
    server.on("upgrade", function(request, socket, head){
        const pathname = url.parse(request.url).pathname;
        let wsServer = websocketServers[pathname];
        if(wsServer) {
            wsServer.handleUpgrade(request, socket, head, function(ws){
                wsServer.emit("connection", ws, request);
            });
        } else {
            socket.destroy();
        }
    });
};

function onMessageHandler(options, rootDirectory, msg) {
    let ws = this;
    let localUrl = options.decodeMessage(msg);
    if(localUrl.charAt(0) !== "/") {
        localUrl = "/" + localUrl;
    }
    MockFileManager.find("", localUrl, rootDirectory).then(file => {
        if(/\.json5?$/i.test(file)) {
            MockFileManager.mock(file).then(data => {
                let delay = data["#delay#"];
                delete data["#delay#"];
                let msg = options.encodeMessage(null, data);
                setTimeout(() => ws.send(msg), delay || 0);
            }, function(error){
                let msg = options.encodeMessage(error);
                ws.send(msg);
            });
        } else {
            fs.readFile(file, function(error, data){
                let msg = options.encodeMessage(error, data);
                ws.send(msg);
            });
        }
    }, error => {
        let msg = options.encodeMessage(error);
        ws.send(msg);
    });
}
