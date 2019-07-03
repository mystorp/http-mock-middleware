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
            MockFileManager.find("GET", "/number2/123/test", mockDirectoryPrefix)
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
            MockFileManager.find("GET", "/email2/xx@yy.com/test", mockDirectoryPrefix)
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
            MockFileManager.find("GET", "/ip2/127.0.0.1/test", mockDirectoryPrefix)
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
            MockFileManager.find("GET", "/uuid2/9125a8dc-52ee-365b-a5aa-81b0b3681cf6/test", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    test("directory not exists will throw error", function(){
        return expect(
            MockFileManager.find("GET", "/dir/not/exists", mockDirectoryPrefix).catch(e => Promise.reject(e.message))
        ).rejects.toMatch(/^ENOENT: no such file or directory, stat.*/);
    });
    test("normal directory name refer to other file will throw error", function(){
        let filepath = mockFile("/dir1/dir2", "");
        return expect(
            MockFileManager.find("GET", "/dir1/dir2/file", mockDirectoryPrefix).catch(e => Promise.reject(e.message))
        ).rejects.toMatch(/^can't find mock directory/);
    });
    test("magic directory name refer to other file will throw error", function(){
        let filepath = mockFile("/dir1/[number]", "");
        return expect(
            MockFileManager.find("GET", "/dir1/32323/file", mockDirectoryPrefix).catch(e => Promise.reject(e.message))
        ).rejects.toMatch(/^can't find mock directory/);
    });
    test("directory exists buf file not exists will throw error", function(){
        let filepath = mockFile("/path/to/file", "");
        return expect(
            MockFileManager.find("GET", "/path/to/file2", mockDirectoryPrefix).catch(e => Promise.reject(e.message))
        ).rejects.toMatch(/can't find mock file/);
    });
    test("directory may have multiple magic names", function(){
        let filepath = mockFile("/dir/may/match/[number]/[ip]/[email]/[uuid]/together", "");
        return expect(
            MockFileManager.find("GET", "/dir/may/match/322/127.32.23.22/hel@fds.com/45745c60-7b1a-11e8-9c9c-2d42b21b1a3e/together", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    test("filename can be magic too", function(){
        let filepath = mockFile("/match/file/[number]", "");
        return expect(
            MockFileManager.find("GET", "/match/file/32323", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    test("mock file in root directory can be matched", function(){
        let filepath = mockFile("/rootfile", "");
        return expect(
            MockFileManager.find("GET", "/rootfile", mockDirectoryPrefix)
        ).resolves.toBe(filepath);
    });
    test("match first file when there have multiple matched files and file names are not start with request method", function(){
        let filepath = mockFile("/match/file/aa.txt", "");
        let filepath2 = mockFile("/match/file/aa.jpg", "");
        return expect(
            MockFileManager.find("", "/match/file/aa", mockDirectoryPrefix).then(file => {
                // we can't know which one is the first file
                return file === filepath || file === filepath2;
            })
        ).resolves.toBe(true);
    });
});

describe("test mock function:", function(){
    test("use Mockjs syntax:", function(){
        let filepath = mockFile("/mock.json", JSON.stringify({"ip": "@ip"}));
        return expect(
            MockFileManager.mock(filepath).then(json => isIP(json.data.ip))
        ).resolves.toBeTruthy();
    });
    test("use json5 syntax:", function(){
        let filepath = mockFile("/json5.json", "{json5: 'yes'}");
        return expect(
            MockFileManager.mock(filepath).then(json => JSON.stringify(json.data))
        ).resolves.toBe(JSON.stringify({json5: "yes"}));
    });
});
