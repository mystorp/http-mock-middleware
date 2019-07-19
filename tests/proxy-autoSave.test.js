const fs = require("fs");
const { setup, createServer } = require("./utils");

const isCI = process.env.TRAVIS && process.env.CI;
const mockDirectoryPrefix = "tests/.data/proxy-autoSave";
const mockFile = setup(mockDirectoryPrefix);

describe("proxy with autoSave and rename", function(){
    let axios, server;
    beforeAll(function(done) {
        createServer({
            mockRules: {
                "/": mockDirectoryPrefix
            },
            proxy: {
                autoSave: true,
                saveDirectory: mockDirectoryPrefix,
                overrideSameFile: "rename"
            }
        }, function(args){
            ({axios, server} = args);
            done();
        });
    });
    afterAll(function(){
        server.close();
    });

    test("auto save proxy data to local disk", function(){
        let savedFile = mockDirectoryPrefix + "/package/get-local-http-mock";
        if(fs.existsSync(savedFile)) {
            fs.unlinkSync(savedFile);
        }
        return expect(axios.get("/package/local-http-mock", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://www.npmjs.com" : "https://npm.taobao.org"
            }
        }).then(resp => {
            let proxyData = resp.data;
            let savedData = fs.readFileSync(savedFile, "utf-8");
            return proxyData === savedData;
        })).resolves.toBe(true);
    });
    test("auto save proxy data to json", function(done){
        let savedFile = mockDirectoryPrefix + "/local-http-mock/get-1.0.0.json";
        if(fs.existsSync(savedFile)) {
            fs.unlinkSync(savedFile);
        }
        axios.get("/local-http-mock/1.0.0", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://registry.npmjs.com" : "https://registry.npm.taobao.org"
            }
        }).then(resp => {
            let savedData = null
            try {
                savedData = JSON.parse(fs.readFileSync(savedFile, "utf-8"));
                expect(resp.data).toEqual(savedData);
            } catch(e) {}
            done();
        });
    });
    test("rename exists file when save proxy data to local disk", function(done){
        mockFile("/package/get-axios", "test");
        axios.get("/package/axios", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://www.npmjs.com" : "https://npm.taobao.org"
            }
        }).then(resp => {
            let content = fs.readFileSync(mockDirectoryPrefix + "/package/get-axios.1", "utf-8");
            try {
                expect(content).toBe("test");
                expect(fs.existsSync(mockDirectoryPrefix + "/package/get-axios")).toBe(true);
            } catch(e) {}
            done();
        });
    });
});

describe("proxy with autoSave and override", function(){
    let axios, server;
    beforeAll(function(done) {
        createServer({
            mockRules: {
                "/": mockDirectoryPrefix
            },
            proxy: {
                autoSave: true,
                saveDirectory: mockDirectoryPrefix,
                overrideSameFile: "override"
            }
        }, function(args){
            ({axios, server} = args);
            done();
        });
    });
    afterAll(function(){
        server.close();
    });
    test("not save proxy data if request url is /", function(){
        return expect(axios.get("/", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://www.npmjs.com" : "https://npm.taobao.org"
            }
        }).catch(e => Promise.reject(e.response.status))).rejects.toBe(404);
    });
    test("override exists file when save proxy data to local disk", function(done){
        mockFile("/package/get-ws", "test");
        axios.get("/package/ws", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://www.npmjs.com" : "https://npm.taobao.org"
            }
        }).then(resp => {
            let content = fs.readFileSync(mockDirectoryPrefix + "/package/get-ws", "utf-8");
            try {
                expect(content).not.toBe("test");
                expect(resp.data).toBe(content);
            } catch(e) {}
            done();
        });
    });
});
