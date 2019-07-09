#!/usr/bin/env node

const argv = require("yargs").argv;
const portfinder = require("portfinder");

if(argv.h || argv.help) {
    usage();
} else {
    startServer(makeOptions(argv));
}

function usage(){
    console.log("usage: http-server [options]"); console.log(""); console.log("options:");
    console.log("  -p --port    Port to use (default: 8080)");
    console.log("  -a --addr    Address to use (default: 0.0.0.0)");
    console.log("  -d --dir     Root directory to serve from (default: PWD)");
    console.log("  -S --ssl     Enable https.");
    console.log("  -C --cert    Path to ssl cert file (default: cert.pem).");
    console.log("  -K --key     Path to ssl key file (default: key.pem).");
    console.log("  -h --help");
}

function makeOptions(argv){
    return {
        port: argv.p || argv.port || 8080,
        address: argv.a || argv.addr || "0.0.0.0",
        dir: argv.d || argv.dir || process.cwd(),
        ssl: argv.S || argv.ssl || false,
        cert: argv.C || argv.cert,
        key: argv.K || argv.key
    };
}

function startServer(options){
    const express = require("express");
    const localHttpMock = require("..");
    const app = express();
    app.use("/", localHttpMock());
    const serverOptions = options.ssl ? {
        cert: options.cert,
        key: options.key
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
    if(options.address === "0.0.0.0") {
        let ifaces = require("os").networkInterfaces();
        for(let name of Object.keys(ifaces)) {
            for(let dev of ifaces[name]) {
                if(dev.family === "IPv4") {
                    addressArray.push(dev.address);
                }
            }
        }
    } else {
        addressArray.push(options.address);
    }
    for(let address of addressArray) {
        console.log(`${prefix}${protocol}://${address}:${port}`);
        prefix = " ".repeat(prefix.length);
    }
}
