const fs = require("fs");
const express = require("express");
const axios = require("axios");
const localHttpMock = require("../");
const rimraf = require("rimraf");

const mockDirectoryPrefix = "tests/.data/proxy-autoSave";
const mockFile = require("./utils").mockFile.bind(this, mockDirectoryPrefix);

beforeAll(function(){
    fs.writeFileSync("mockrc.json", JSON.stringify({
        "/": mockDirectoryPrefix
    }));
});
afterAll(function(){
    rimraf.sync(mockDirectoryPrefix);
    fs.unlinkSync("mockrc.json");
});

describe("proxy with autoSave and rename", function(){
    let currentApp, currentServer, currentBaseUrl;
    beforeAll(function(done){
        currentApp = express();
        currentApp.use(localHttpMock({
            proxy: {
                autoSave: true,
                saveDirectory: mockDirectoryPrefix,
                overrideSameFile: "rename"
            }
        }));
        axios.interceptors.request.use(function(config){
            if(config.url.indexOf("/") === 0) {
                config.url = currentBaseUrl + config.url;
            }
            return config;
        });
        currentServer = currentApp.listen(function(){
            let addr = currentServer.address();
            currentBaseUrl = "http://127.0.0.1:" + addr.port;
            done();
        });
    });
    
    afterAll(function(){
        currentServer.close();
        currentApp = currentServer = currentBaseUrl = null;
    });

    test("auto save proxy data to local disk", function(){
        let savedFile = mockDirectoryPrefix + "/package/get-local-http-mock";
        if(fs.existsSync(savedFile)) {
            fs.unlinkSync(savedFile);
        }
        return expect(axios.get("/package/local-http-mock", {
            headers: {
                "X-Mock-Proxy": "https://www.npmjs.com"
            }
        }).then(resp => {
            let proxyData = resp.data;
            let savedData = fs.readFileSync(savedFile, "utf-8");
            return proxyData === savedData;
        })).resolves.toBe(true);
    });
    test("auto save proxy data to json", function(){
        let savedFile = mockDirectoryPrefix + "/local-http-mock/get-1.0.0.json";
        if(fs.existsSync(savedFile)) {
            fs.unlinkSync(savedFile);
        }
        return expect(axios.get("/local-http-mock/1.0.0", {
            headers: {
                "X-Mock-Proxy": "https://registry.npmjs.com"
            },
            responseType: "text"
        }).then(resp => {
            let proxyData = resp.data;
            if(typeof proxyData === "object") {
                proxyData = JSON.stringify(proxyData);
            }
            let savedData = fs.readFileSync(savedFile, "utf-8");
            return proxyData === savedData;
        })).resolves.toBe(true);
    });
    test("rename exists file when save proxy data to local disk", function(){
        mockFile("/package/get-axios", "test");
        return expect(axios.get("/package/axios", {
            headers: {
                "X-Mock-Proxy": "https://www.npmjs.com"
            }
        }).then(resp => {
            let content = fs.readFileSync(mockDirectoryPrefix + "/package/get-axios.1", "utf-8");
            return "test" === content && fs.existsSync(mockDirectoryPrefix + "/package/get-axios");
        })).resolves.toBe(true);
    });
});

describe("proxy with autoSave and override", function(){
    let currentApp, currentServer, currentBaseUrl;
    beforeAll(function(done){
        currentApp = express();
        currentApp.use(localHttpMock({
            proxy: {
                autoSave: true,
                saveDirectory: mockDirectoryPrefix,
                overrideSameFile: "override"
            }
        }));
        // TODO: use new Axios
        axios.interceptors.request.use(function(config){
            if(config.url.indexOf("/") === 0) {
                config.url = currentBaseUrl + config.url;
            }
            return config;
        });
        currentServer = currentApp.listen(function(){
            let addr = currentServer.address();
            currentBaseUrl = "http://127.0.0.1:" + addr.port;
            done();
        });
    });
    
    afterAll(function(){
        currentServer.close();
        currentApp = currentServer = currentBaseUrl = null;
    });
    test("not save proxy data if request url is /", function(){
        return expect(axios.get("/", {
            headers: {
                "X-Mock-Proxy": "https://www.npmjs.com"
            }
        }).catch(e => Promise.reject(e.response.status))).rejects.toBe(404);
    });
    test("override exists file when save proxy data to local disk", function(){
        mockFile("/package/get-ws", "test");
        return expect(axios.get("/package/ws", {
            headers: {
                "X-Mock-Proxy": "https://www.npmjs.com"
            }
        }).then(resp => {
            let content = fs.readFileSync(mockDirectoryPrefix + "/package/get-ws", "utf-8");
            return "test" !== content && resp.data === content;
        })).resolves.toBe(true);
    });
});