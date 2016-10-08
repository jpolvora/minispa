define([], function () {
    'use strict';

    function getParameters(hash) {
        var paramStr = "";
        var parameters = {};

        var indexOf = hash.indexOf("?");
        if (indexOf >= 0) {
            paramStr = hash.slice(indexOf + 1);
        }

        paramStr.split("&").forEach(function (x) {
            var arr = x.split("=");
            arr[1] && (parameters[arr[0]] = arr[1]);
        });

        return parameters;
    }

    //todo: implement subrouters 
    var router = function (app, parentRouter) {
        var self = this;
        self._running = false;
        self._app = app;
        self._parentRouter = parentRouter;
    };

    router.prototype.hashHandler = function(evt) {
        var self = this;
        if (evt) {
            self._app.log('execute route: ' + evt.type);
        } else {
            self._app.log('execute route first time');
        }

        if (!self._running) return;

        var hash = location.hash;
        if (!hash || hash.length === 0 || hash.indexOf('#') === -1) {
            location.hash = '#/'; //will fire hashchange event.
            return;
        }

        var parameters = getParameters(hash);
        var url = "/";
        if (hash.indexOf("?") >= 0) {
            url = hash.slice(1, hash.indexOf("?"));

        } else {
            url = hash.slice(1);
        }

        self._app.loadPage(url, parameters);
    };

    router.prototype.start = function() {
        var self = this;
        window.addEventListener('hashchange', self.hashHandler.bind(self));
        self._running = true;
        self._app.log('router started');

        self.hashHandler(null);

    };

    router.prototype.stop = function() {
        var self = this;
        window.removeEventListener('hashchange', self.hashHandler);
        self._running = false;
        self._app.log('router stopped');
    };

    return router;
});