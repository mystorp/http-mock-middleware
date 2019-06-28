const fs = require("fs");
const path = require("path");
const url = require("url");
const WebSocket = require("ws");
const MockFileManager = require("../MockFileManager");

module.exports = function(options, rules){
    let server = options.server;
    let websocketOptions = options.websocket;
    let websocketServers = {};
    rules.forEach(rule => {
        let {url, rootDirectory} = rule;
        websocketServers[url] = new WebSocket.Server({ noServer: true });
        websocketServers[url].on("connection", function(ws){
            ws.on("message", function(msg){
                let localUrl = websocketOptions.decodeMessage(msg);
                if(localUrl.charAt(0) !== "/") {
                    localUrl = "/" + localUrl;
                }
                return onMessageHandler.call(ws, localUrl, rootDirectory, websocketOptions);
            });
            let greetingFile = path.resolve(rootDirectory, "__greeting__");
            fs.stat(greetingFile, (err, stat) => {
                if(err) { return; }
                if(!stat.isFile()) { return; }
                onMessageHandler.call(ws, "/__greeting__", rootDirectory, websocketOptions);
            });
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

function onMessageHandler(url, rootDirectory, options) {
    let ws = this;
    MockFileManager.findAndMock("", url, rootDirectory, {
        websocket: true
    }).then(function(value){
        let data = value.data;
        let msg = options.encodeMessage(null, data);
        ws.send(msg);
    }, function(error){
        let msg = options.encodeMessage(error);
        ws.send(msg);
    });
}
