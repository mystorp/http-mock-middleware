const { createServer } = require("./utils");
const isCI = process.env.TRAVIS && process.env.CI;
const mockDirectoryPrefix = "tests/.data/proxy";


describe("proxy mock test", function(){
    let axios, server;
    beforeAll(function(done) {
        createServer({
            mockRules: {
                "/": mockDirectoryPrefix
            }
        }, function(args){
            ({axios, server} = args);
            done();
        });
    });
    
    afterAll(function(){
        server.close();
    });

    test("proxy request to npmjs if has http header 'X-Mock-Proxy: https://www.npmjs.com'", function(){
        return expect(axios.get("/package/hm-middleware", {
            headers: {
                "X-Mock-Proxy": isCI ? "https://www.npmjs.com" : "https://npm.taobao.org"
            }
        }).then(resp => resp.data)).resolves.toMatch(isCI ? /hm-middleware  -  npm<\/title>/ : /<title>Package - hm-middleware/);
    });
});
