const axios = require("axios");
axios.get("http://127.0.0.1:3459/package/axios", {
    headers: {
        "X-Mock-Proxy": "https://npm.taobao.org"
    }
}).then(resp => console.log(resp.data))