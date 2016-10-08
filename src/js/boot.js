define(function (require) {

    System.import('bootstrap/css/bootstrap.css!').then(() => {
        System.import('styles/dashboard.css!').then(() => {
            var $ = require('jquery'),
                bs = require('bootstrap'),
                toastr = require('toastr'),
                moment = require('moment'),
                ptbr = require('moment/locale/pt-br.js'),
                ko = require('knockout'),
                spin = require('spin'),
                spa = require('js/spa.js');


            //dynamic app dependencies
            var jsIndex = require("js/index");

            toastr.options.progressBar = true;
            toastr.options.closeButton = true;
            toastr.options.fadeIn = 0;
            toastr.options.fadeOut = 0;
            toastr.options.positionClass = "toast-bottom-right";

            moment.locale("pt-BR");


            ko.bindingHandlers.moment = {
                update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                    var val = valueAccessor();
                    var date = moment(ko.utils.unwrapObservable(val));
                    var format = allBindingsAccessor().format || 'L';
                    element.innerText = date.format(format);
                }
            };

            /* customization */
            spa.options({
                appRoot: "app-root",
                spinner: 'spinner',
                environment: "debug" || "release",
                index: "index",
                logger: console.log
            });


            spa.setFactory(function (objParams) {
                //if (objParams && objParams.url) {
                //    var url = objParams.url;
                //    switch (url) {
                //        case "/cursos":
                //            return jsCursos;
                //        case "/curso-frm":
                //            return jsCursoFrm;
                //        case "/categorias":
                //            return jsCategorias;
                //        default:
                //            return require("js/index");
                //    }
                //}

                return null;
            });

            spa.on('afterActivate', function (vm) {
                $("a.hashlink").each(function () {
                    $(this).parent("li").removeClass("active");
                    if (location.hash === $(this).attr("href")) {
                        $(this).parent("li").addClass("active");
                    }
                });
            });

            spa.on('afterDeactivate', function (vm) {
                toastr.remove();
            });

            spa.on('error', function (error) {
                console.error(arguments);
                if (error) {
                    if (error.originalErr) {
                        if (error.originalErr.message) {
                            toastr.error(error.originalErr.message);
                        } else {
                            toastr.error(error.originalErr);
                        }
                    } else if (error.message) {
                        toastr.error(error.message);
                    } else {
                        toastr.error(error);
                    }
                    spa.setContent(error);
                }
            });

            spa.run();
        });
    });
});