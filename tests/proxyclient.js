const axios = require("axios");
axios.get("http://127.0.0.1:3459/", {
    headers: {
        "X-Mock-Proxy": "http://172.16.201.188:8088/"
    }
}).then(resp => console.log(resp.data))