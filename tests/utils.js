const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const express = require("express");
const http = require("http");
const axios = require("axios");
const rimraf = require("rimraf");
const httpMockMiddleware = require("..");

exports.mockFile = mockFile;
exports.createServer = createServer;
exports.setup = setup;

function mockFile(prefix, file, content) {
    if(prefix && file.indexOf(prefix) !== 0) {
        file = prefix + file;
    }
    mkdirp.sync(path.dirname(file));
    fs.writeFileSync(file, content);
    return path.resolve(file);
}

function createServer(options, callback){
    let server = http.createServer();
    if(options && options.websocket) {
        options.websocket.server = server;
    }
    let app = express();
    app.use(httpMockMiddleware(options));
    server.on("request", app);
    server.listen(function(){
        let port = server.address().port;
        let axiosInstance = axios.create();
        axiosInstance.interceptors.request.use(function(config){
            config.url = `http://127.0.0.1:${port}` + config.url;
            return config;
        });
        callback({axios: axiosInstance, server, host: "127.0.0.1", port});
    });
}

function setup(dir) {
    afterAll(function(){
        rimraf.sync(dir);
    });
    return mockFile.bind(this, dir);
}
