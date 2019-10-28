define(["require", "/ecosui/export/ecos/exports/js/exports.min.js"], function (moduleRequire, uiExports) {
    "use strict";

    // load modules from ecos-ui
    return {

        load: function (resourceDef, require, callback) {

            var self = this;
            self.modulesCache = self.modulesCache || {};

            var fromCache = self.modulesCache[resourceDef];
            if (fromCache) {
                if (fromCache.then) {
                    fromCache.then(function (v) {
                        callback(v);
                    })
                } else {
                    callback(fromCache);
                }
                return;
            }

            var key = resourceDef.replace(/\/.+/, '');

            var module = uiExports.default[key];
            if (!module) {
                console.error("ECOS UI Resource " + resourceDef + " with key " + key + "is not found!", uiExports.default);
                callback(null);
                return;
            }
            if (module.call && module.apply) {
                module = module();
            }

            self.modulesCache[resourceDef] = module;

            if (module.then) {
                module.then(function (m) {
                    self.modulesCache[resourceDef] = m;
                    callback(m);
                })
            } else {
                callback(module);
            }
        }
    };
});
