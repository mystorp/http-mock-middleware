const fs = require("fs");
const express = require("express");
const axios = require("axios");
const localHttpMock = require("../");
const rimraf = require("rimraf");

const isCI = process.env.TRAVIS && process.env.CI;
const mockDirectoryPrefix = "tests/.data/proxy-autoSave";
const mockFile = require("./utils").mockFile.bind(this, mockDirectoryPrefix);

afterAll(function(){
    rimraf.sync(mockDirectoryPrefix);
});

describe("proxy with autoSave and rename", function(){
    let currentApp, currentServer, currentBaseUrl, axiosInstance;
    beforeAll(function(done){
        axiosInstance = axios.create();
        currentApp = express();
        currentApp.use(localHttpMock({
            mockRules: {
                "/": mockDirectoryPrefix
            },
            proxy: {
                autoSave: true,
                saveDirectory: mockDirectoryPrefix,
                overrideSameFile: "rename"
            }
        }));
        axiosInstance.interceptors.request.use(function(config){
            config.url = currentBaseUrl + config.url;
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
        return expect(axiosInstance.get("/package/local-http-mock", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://www.npmjs.com" : "https://npm.taobao.org"
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
        return expect(axiosInstance.get("/local-http-mock/1.0.0", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://registry.npmjs.com" : "https://registry.npm.taobao.org"
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
        return expect(axiosInstance.get("/package/axios", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://www.npmjs.com" : "https://npm.taobao.org"
            }
        }).then(resp => {
            let content = fs.readFileSync(mockDirectoryPrefix + "/package/get-axios.1", "utf-8");
            return "test" === content && fs.existsSync(mockDirectoryPrefix + "/package/get-axios");
        })).resolves.toBe(true);
    });
});

describe("proxy with autoSave and override", function(){
    let currentApp, currentServer, currentBaseUrl, axiosInstance;
    beforeAll(function(done){
        axiosInstance = axios.create();
        currentApp = express();
        currentApp.use(localHttpMock({
            mockRules: {
                "/": mockDirectoryPrefix
            },
            proxy: {
                autoSave: true,
                saveDirectory: mockDirectoryPrefix,
                overrideSameFile: "override"
            }
        }));
        axiosInstance.interceptors.request.use(function(config){
            config.url = currentBaseUrl + config.url;
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
        return expect(axiosInstance.get("/", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://www.npmjs.com" : "https://npm.taobao.org"
            }
        }).catch(e => Promise.reject(e.response.status))).rejects.toBe(404);
    });
    test("override exists file when save proxy data to local disk", function(){
        mockFile("/package/get-ws", "test");
        return expect(axiosInstance.get("/package/ws", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://www.npmjs.com" : "https://npm.taobao.org"
            }
        }).then(resp => {
            let content = fs.readFileSync(mockDirectoryPrefix + "/package/get-ws", "utf-8");
            return "test" !== content && resp.data === content;
        })).resolves.toBe(true);
    });
});
