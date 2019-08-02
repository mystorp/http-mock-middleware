#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const _readFile = (f) => f && fs.existsSync(f) ? fs.readFileSync(f) : null;
const argv = require("yargs").usage("http-mock-server [Options]").options({
    port: {
        alias: "p",
        default: 8080,
        describe: "Port to use"
    },
    host: {
        alias: "h",
        default: "0.0.0.0",
        describe: "Host to use"
    },
    dir: {
        alias: "d",
        describe: "Root directory that mock data is served from"
    },
    ssl: {
        alias: "S",
        default: false,
        boolean: true,
        describe: "Enable https"
    },
    cert: {
        alias: "C",
        default: "cert.pem",
        coerce: _readFile,
        describe: "Path to ssl cert file"
    },
    key: {
        alias: "K",
        default: "key.pem",
        coerce: _readFile,
        describe: "Path to ssl key file"
    },
    passphrase: {
        alias: "p",
        describe: "Passphrase of private key"
    },
    static: {
        alias: "s",
        array: true,
        default: ["."],
        describe: "Base path of any other static files"
    },
    websocket: {
        alias: "w",
        boolean: true,
        default: false,
        describe: "Enable websocket"
    },
    "websocket-options": {
        alias: "x",
        default: "./websocket.options.js",
        describe: "Websocket options file",
        coerce: (v) => path.resolve(v)
    }
}).argv;
const portfinder = require("portfinder");

startServer(argv);

function startServer(options){
    const express = require("express");
    const httpMockMiddleware = require("..");
    let middlewareOptions;
    try {
        middlewareOptions = getMiddlewareOptions(options);
    } catch(e) {
        console.log(e.message);
        return;
    }
    const server = createServer(options);
    const app = express();
    options.static.forEach(staticDir => {
        console.log("static files is served from:", staticDir);
        app.use(express.static(staticDir));
    });
    if(middlewareOptions.websocket) {
        middlewareOptions.websocket.server = server;
    }
    console.log("mock rules:", middlewareOptions.mockRules);
    app.use("/", httpMockMiddleware(middlewareOptions));
    server.on("request", app);
    portfinder.getPort({port: options.port}, function(error, port){
        if(error) {
            throw error;
        }
        options.port = port;
        server.listen(options.port, options.address, function(){
            console.log("local-http-mock run as server");
            showAddresses(options);
        });
    });
}

function getMiddlewareOptions(options) {
    let hasRc = fs.existsSync("./mockrc.json");
    let mockRules;
    try {
        mockRules = JSON.parse(fs.readFileSync("./mockrc.json", "utf-8"));
    } catch(e) {
        if(options.websocket) {
            throw e;
        }
    }
    if(options.dir && options.websocket) {
        console.error(`websocket enabled, so "./mockrc.json" takes precedence over "--dir ${options.dir}"`);
    }
    if(options.websocket) {
        return {websocket: require(options.websocketOptions), mockRules};
    }
    if(hasRc && !options.dir) { return {mockRules}; }
    mockRules = {"/": options.dir || ".data"};
    return {mockRules};
}

function createServer(options){
    const mod = require(options.ssl ? "https" : "http");
    const serverOptions = options.ssl ? {
        cert: options.cert,
        key: options.key,
        passphrase: options.passphrase
    } : null;
    return options.ssl ? mod.createServer(serverOptions) : mod.createServer();
}

function showAddresses(options){
    let { port, ssl } = options;
    let prefix = "it started at: ";
    let protocol = ssl ? "https" : "http";
    let addressArray = [];
    if(options.host === "0.0.0.0") {
        let ifaces = require("os").networkInterfaces();
        for(let name of Object.keys(ifaces)) {
            for(let dev of ifaces[name]) {
                if(dev.family === "IPv4") {
                    addressArray.push(dev.address);
                }
            }
        }
    } else {
        addressArray.push(options.host);
    }
    for(let address of addressArray) {
        console.log(`${prefix}${protocol}://${address}:${port}`);
        prefix = " ".repeat(prefix.length);
    }
}
