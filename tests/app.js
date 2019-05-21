let express = require("express");
let localHttpMock = require("../");
let app = express();
app.use(localHttpMock());
app.listen(3459);