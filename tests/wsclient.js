let fs = require("fs");
let path = require("path");
let mkdirp = require("mkdirp");
let WebSocket = require("ws");
let socket = new WebSocket("ws://127.0.0.1:3459/ws");
let msg = ("" + Math.random()).substring(2);
socket.on("open", function(){
    mockFile("tests/.data/user/get", msg);
    socket.send(JSON.stringify({type: "user", method: "get"}));
});
socket.on("message", function(e){
    console.log(e === Buffer.from(msg).toString("base64"));
    socket.close();
});
function mockFile(file, content) {
    mkdirp.sync(path.dirname(file));
    fs.writeFileSync(file, content);
}