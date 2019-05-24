const url = require("url");
const http = require("http");
const https = require("https");
/**
 * redirect request to `X-Mock-Proxy`
 */
module.exports = function(req, resp, next){
    let newUrl = req.get("X-Mock-Proxy") + req.url;
    let urlParts = url.parse(newUrl);
    let headers = req.headers;
    headers.host = urlParts.host;
    headers["connection"] = "close";
    const mod = urlParts.protocol === "https:" ? https : http;
    let proxyRequest = mod.request({
        hostname: urlParts.hostname,
        port: urlParts.port,
        path: urlParts.path,
        method: req.method,
        headers: headers
    }, function(response){
		resp.writeHead(response.statusCode, response.headers);
		response.pipe(resp);
	});
	proxyRequest.on('error', function(e){
		resp.writeHead(500);
		resp.end(e.message + "\n" + e.stack);
	});
	req.pipe(proxyRequest);
};