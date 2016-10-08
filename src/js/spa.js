define(['js/router.js', 'knockout', 'spin'], function (Router, ko, Spinner) {
    'use strict';


    var spin_presets = {
        tiny: { lines: 8, length: 2, width: 2, radius: 3 },
        small: { lines: 8, length: 4, width: 3, radius: 5 },
        large: { lines: 10, length: 8, width: 4, radius: 8 }
    };

    var
        emptyFn = function () { },
        defaultLogger = console.log,
        currentVm,
        router,
        currentUrl,
        currentParameters,
        appRoot,
        spinnerInstance,
        spinnerIsRunning = false,
        spinnerTarget,
        bindWasApplied = false,
        factory = function () {
            //default factory
            return null;
        },
        eventHandlers = {
            beforeActivate: Array(),
            afterActivate: Array(),
            afterDeactivate: Array(),
            error: Array()
        },
        options = {
            appRoot: "app-root",
            spinner: 'spinner',
            environment: "debug",
            index: "index",
            logger: defaultLogger
        };

    var Spa = function () { };

    function invokeEvent(eventId, eventArgs) {
        var arr = eventHandlers[eventId] || [];
        arr.forEach(function (fn) {
            if (typeof fn === "function") {
                fn.call(this, eventArgs);
            }
        });
    }

    Spa.prototype.option = function (key, value) {
        options[key] = value;
    };

    Spa.prototype.options = function (config) {
        for (var key in config) {
            if (config.hasOwnProperty(key)) {
                options[key] = config[key];
            }
        }
    };

    Spa.prototype.on = function (eventId, fn) {
        var arr = eventHandlers[eventId] || [];
        arr.push(fn);
        eventHandlers[eventId] = arr;
    };

    Spa.prototype.busy = function (isBusy) {
        var self = this;
        if (!spinnerInstance) {
            spinnerTarget = document.getElementById(options["spinner"]);
            spinnerInstance = new Spinner(spin_presets['large']).spin(spinnerTarget);
            self.log("spinner created at: " + spinnerTarget);
        }

        if (isBusy) {
            spinnerInstance.spin(spinnerTarget);
            spinnerIsRunning = true;
        } else {
            spinnerInstance.stop();
            spinnerIsRunning = false;
        }
    };

    Spa.prototype.on = function (eventId, fn) {
        var arr = eventHandlers[eventId] || [];
        arr.push(fn);
        eventHandlers[eventId] = arr;
    };

    Spa.prototype.log = function () {
        var logger;

        if (options.environment === "debug") {
            logger = defaultLogger;
        } else {
            logger = emptyFn;
        }

        if (typeof options.logger === "function") {
            logger = options.logger;
        }

        return logger.apply(this, arguments);
    };

    Spa.prototype.getAppRoot = function () {
        if (!appRoot) appRoot = $('#' + options["appRoot"])[0];
        return appRoot;
    };


    Spa.prototype.getRouter = function () {
        if (!router) router = new Router(this);
        return router;
    };

    Spa.prototype.setFactory = function (newFactory) {
        factory = newFactory;
    };


    Spa.prototype.onBeforeActivate = function (vm) {
        this.log('onBeforeActivate');
        invokeEvent("beforeActivate", vm);
    };

    Spa.prototype.onAfterActivate = function (vm) {
        this.log('onAfterActivate');
        invokeEvent("afterActivate", vm);
    };

    Spa.prototype.onAfterDeactivate = function (vm) {
        this.log('onAfterDeactivate');
        invokeEvent("afterDeactivate", vm);
    };

    Spa.prototype.onError = function (error) {
        invokeEvent.call(this, "error", error);
    };

    Spa.prototype.reload = function () {
        this.log("reloading: " + location.hash);
        this.loadPage(currentUrl, currentParameters);
    };

    function sanitize(url) {
        if (!url || typeof url !== "string" || url.length === 0) {
            return false;
        }

        while (url[url.length - 1] === "/") {
            url = url.slice(0, -1);
        }

        while (url[0] === "/") {
            url = url.slice(1);
        }

        url = '/' + url;

        if (url === "/") {
            url = url + (options["index"] || "index").toString();
        }

        return url;
    }

    function tryDeactivate() {
        if (currentVm) {
            if (typeof currentVm.deactivate === "function") {
                currentVm.deactivate();
                return true;
            }
        }
        return false;
    }

    function unbind() {
        if (!bindWasApplied) return;

        var self = this;
        console.log("unbinding... ");
        var rootNode = self.getAppRoot();
        ko.cleanNode(rootNode);
        bindWasApplied = false;
    }

    function bind() {
        var self = this;
        if (bindWasApplied) {
            debugger;
            return;
        }
        var vmToBind = currentVm || self;

        console.log("binding... ");
        var rootNode = self.getAppRoot();
        ko.applyBindings(vmToBind, rootNode);
        bindWasApplied = true;
    }

    function tryActivate(vm, parameters) {
        var self = this;
        return new Promise(function (resolve, reject) {
            currentVm = vm;
            if (vm) {
                self.onBeforeActivate(vm);

                if (typeof vm.template === "function") {
                    var template = vm.template();
                    self.setContent(template);
                } else if (vm.template) {
                    self.setContent(vm.template);
                } else {
                    self.setContent("Template = null");
                }

                if (typeof vm.activate !== "function") {
                    resolve();
                }

                vm.activate(parameters).then(function (p) {
                    bind.call(self);
                    resolve(p);
                }).catch(function (err) {
                    reject(err);
                });
            } else {
                reject(new Error("cannot activate null module"));
            }
        });
    }


    Spa.prototype.loadPage = function (url, parameters) {
        url = sanitize(url);
        currentUrl = url;
        currentParameters = parameters || {};
        if (!url) return;

        var self = this;
        self.log('loading page: ' + location.hash);

        self.busy(true);

        if (tryDeactivate()) {
            self.onAfterDeactivate(currentVm);
        }

        unbind.call(self);

        //to bundle-sfx, need to remove SystemJS.import.
        //call spa.setFactory on bootstrapper

        function getModule(moduleUrl) {
            return new Promise(function (resolve, reject) {
                var myModule = factory(moduleUrl);
                if (typeof myModule === "function") {
                    resolve(myModule);
                } else {
                    SystemJS.import('./js' + url).then(function (systemjsmodule) {
                        resolve(systemjsmodule);
                    }).catch(function (error) {
                        reject(error);
                    });
                }
            });
        }


        var objparams = { url: url, parameters: parameters };
        getModule(objparams).then(function (moduleFunc) {
            //do work

            var vm = moduleFunc(); //instantiation
            tryActivate.call(self, vm, parameters).then(function () {
                self.onAfterActivate(vm);
                self.busy(false);
            });
        }).catch(function (error) {
            self.onError(error);
            self.busy(false);
        });
    };

    Spa.prototype.setContent = function (html) {
        $(this.getAppRoot()).html(html);
    };

    Spa.prototype.run = function () {
        var self = this;
        self.log('spa.run() begin.');
        self.setContent(""); //initialize lazy property
        self.busy(false); //initialize lazy property
        bind.call(self);
        self.getRouter().start();
        
        self.log('spa.run() finished.');
    };

    var instance = new Spa();
    return instance;
});