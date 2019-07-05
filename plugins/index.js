/**
 * mock file can have spectial keys which know as directive
 * to archieve more functions
 *
 */
const plugins = [
    require("./cookies"),
    require("./headers"),
    require("./if"),
    require("./var-expansion"),
    require("./delay"),
    require("./status-code"),
    require("./ws-notify"),
    require("./mock")
];
exports.run = runPlugins;

/**
 *
 * @param {context} context object, directive may
 * read values from it
 * @returns {Promise}
 */
function runPlugins(context) {
    context.next = true;
    let value = Promise.resolve(context);
    for(let plugin of plugins) {
        value = value.then(v => v.next ? plugin.parse(v) : v);
    }
    return value;
};
