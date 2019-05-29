const MockFileManager = require("../MockFileManager");
const rimraf = require("rimraf");
const isIP = require("is-ip");

const mockDirectoryPrefix = "tests/.data/MockFileManager";
const mockFile = require("./utils").mockFile.bind(this, mockDirectoryPrefix);

afterAll(function(){
    rimraf.sync(mockDirectoryPrefix);
});

describe("find mock file:", function(){
    // [number]
    test("not map directory '123' to '[number]' if '123' exists", function(){
        let filepath = mockFile("/number1/123/test", "");
        return expect(
            MockFileManager.find("GET", "/number1/123/test", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    test("map directory '123' to '[number]' if '123' not exists", function(){
        let filepath = mockFile("/number2/[number]/test", "");
        return expect(
            MockFileManager.find("GET", "/number2/[number]/test", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    // [email]
    test("not map directory 'xx@yy.com' to '[email]' if 'xx@yy.com' exists", function(){
        let filepath = mockFile("/email1/xx@yy.com/test", "");
        return expect(
            MockFileManager.find("GET", "/email1/xx@yy.com/test", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    test("map directory 'xx@yy.com' to '[email]' if 'xx@yy.com' not exists", function(){
        let filepath = mockFile("/email2/[email]/test", "");
        return expect(
            MockFileManager.find("GET", "/email2/[email]/test", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    // [ip]
    test("not map directory '127.0.0.1' to '[ip]' if '127.0.0.1' exists", function(){
        let filepath = mockFile("/ip1/127.0.0.1/test", "");
        return expect(
            MockFileManager.find("GET", "/ip1/127.0.0.1/test", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    test("map directory '127.0.0.1' to '[ip]' if '127.0.0.1' not exists", function(){
        let filepath = mockFile("/ip2/[ip]/test", "");
        return expect(
            MockFileManager.find("GET", "/ip2/[ip]/test", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    // [uuid]
    test("not map directory '9125a8dc-52ee-365b-a5aa-81b0b3681cf6' to '[uuid]' if '9125a8dc-52ee-365b-a5aa-81b0b3681cf6' exists", function(){
        let filepath = mockFile("/uuid1/9125a8dc-52ee-365b-a5aa-81b0b3681cf6/test", "");
        return expect(
            MockFileManager.find("GET", "/uuid1/9125a8dc-52ee-365b-a5aa-81b0b3681cf6/test", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    test("map directory '9125a8dc-52ee-365b-a5aa-81b0b3681cf6' to '[uuid]' if '9125a8dc-52ee-365b-a5aa-81b0b3681cf6' not exists", function(){
        let filepath = mockFile("/uuid2/[uuid]/test", "");
        return expect(
            MockFileManager.find("GET", "/uuid2/[uuid]/test", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
});

describe("test mock function:", function(){
    test("use Mockjs syntax:", function(){
        let filepath = mockFile("/mock.json", JSON.stringify({"ip": "@ip"}));
        return expect(
            MockFileManager.mock(filepath).then(json => isIP(json.ip))
        ).resolves.toBeTruthy();
    });
    test("use json5 syntax:", function(){
        let filepath = mockFile("/json5.json", "{json5: 'yes'}");
        return expect(
            MockFileManager.mock(filepath).then(json => JSON.stringify(json))
        ).resolves.toBe(JSON.stringify({json5: "yes"}));
    });
});