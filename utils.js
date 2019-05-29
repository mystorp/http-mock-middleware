const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const statAsync = Promise.promisify(fs.stat);
const renameAsync = Promise.promisify(fs.rename);

exports.rotateFile = rotateFile;

/**
 * file.json => file.json.1
 * file.json.1 => file.json.2
 * @param {string} file 
 */
function rotateFile(file) {
    let nextFile = nextRotateFile(file);
    let exists = false;
    return statAsync(file).then((s) => {
        exists = true;
        return rotateFile(nextFile);
    }, () => 0).then(() => {
        if(exists) {
            return renameAsync(file, nextFile);
        }
    });
}

function nextRotateFile(file) {
    let dir = path.dirname(file);
    let name = path.basename(file);
    let re = /\.\d+$/;
    let rotateName;
    if(re.test(name)) {
        let num = name.split(".").pop() * 1 + 1;
        rotateName = name.replace(re, `.${num}`);
    } else {
        rotateName = `${name}.1`;
    }
    return dir + path.sep + rotateName;
}