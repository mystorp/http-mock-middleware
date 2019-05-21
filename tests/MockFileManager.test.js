const MockFileManager = require("../MockFileManager");
const fs = require("fs");
const path = require("path");
const Mockjs = require("mockjs");
const uuid = require("uuid");
const rimraf = require("rimraf");

// generate data in memory
afterAll(function(){
    rimraf.sync("./tests/.data");
});

describe("find mock file:", function(){
    const mockFiles = [
        ["post", "/login"],
        ["GET", "/users/current-user"],
        ["POST", "/user/register"],
        ["get", `/user/${Mockjs.mock("@integer(1, 100000)")}/permissions`, "/user/[number]/permissions"],
        ["get", `/group/${uuid.v1()}/user/${Mockjs.mock("@integer(1, 100000)")}/`, "/group/[uuid]/user/[number]/"],
        ["get", `/group/list/by/${Mockjs.mock("@ip()")}`, "/group/list/by/[ip]"],
        ["get", `/${uuid.v4()}/${Mockjs.mock("@integer(1, 100000)")}/${Mockjs.mock("@ip()")}/${Mockjs.mock("@email()")}/test`, "/[uuid]/[number]/[ip]/[email]/test"]
    ];
    const rootDirectory = "./tests/.data";
    mockFiles.forEach(function(arr){
        test(arr.join(" "), function(){
            let [method, url] = arr;
            let filepath = mockFile(method, arr[2] || url, rootDirectory);
            return expect(MockFileManager.find(method, url, rootDirectory)).resolves.toBe(filepath);
        });
    });
});

describe("test mock function:", function(){
    test("mock simple string:", function(){
        let json = JSON.stringify({
            text: Math.random() + ""
        });
        let filepath = "./tests/.data/test.json";
        writeFileSync(filepath, json);
        return expect(MockFileManager.mock(filepath).then(json => JSON.stringify(json))).resolves.toBe(json);
    });
    test("mock string use Mockjs syntax:", function(){
        let json = {
            "num|5": [1,2,4,5,69,32]
        };
        let filepath = "./tests/.data/test.json";
        writeFileSync(filepath, JSON.stringify(json));
        return expect(MockFileManager.mock(filepath).then(json => json.num.length)).resolves.toBe(30);
    });
});

function mockFile(method, url, rootDirectory) {
    let filepath = rootDirectory + url;
    if(Math.random() > 0.5) {
        let filename = path.basename(url);
        let dirname = path.dirname(url);
        filepath = rootDirectory + dirname + "/" + method.toLowerCase() + "-" + filename;
    }
    // ext
    if(Math.random() > 0.5) {
        filepath += "." + ("" + Math.random()).substr(2, 3);
    }
    writeFileSync(filepath, "{}");
    return path.resolve(filepath);
}

function writeFileSync(file, content) {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, content);
}