define(['js/spa.js', 'views/index.html!text'], function (spa, template) {

    'use strict';

    var viewModel = function () {
        return {
            activate: function () {
                spa.log('activate index');
                return Promise.resolve();
            },
            template: function () {
                return template;
            },
            deactivate: function () {
                spa.log('deactivating index');
            }
        }
    }

    return viewModel;

});