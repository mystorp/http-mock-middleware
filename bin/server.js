#!/usr/bin/env node

const fs = require("fs");
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
        default: ".data",
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
    }
}).argv;
const portfinder = require("portfinder");

startServer(argv);

function startServer(options){
    const express = require("express");
    const httpMockMiddleware = require("..");
    const app = express();
    app.use("/", httpMockMiddleware({
        mockRules: {"/": options.dir}
    }));
    const serverOptions = options.ssl ? {
        cert: options.cert,
        key: options.key,
        passphrase: options.passphrase
    } : {};
    const server = require(
        options.ssl ? "https" : "http"
    ).createServer(serverOptions, app);
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
