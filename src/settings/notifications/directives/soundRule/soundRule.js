import soundDefs from 'core/config/soundDefinitions'
import app from 'settings/app';
import core from 'common/core';

import template from 'settings/notifications/directives/soundRule/soundRule.html';

import 'settings/notifications/directives/playSound/playSound';

export default app.directive('soundRule', () => {
    return {
        scope: {
            rule: '=',
        },
        templateUrl: template,
        controller($scope, $element, $attrs, $transclude) {
            core.views.subscribe((config) => {
                $scope.$evalAsync(() => {
                    $scope.sounds = config.notifications.sounds.library;
                    $scope.config = config;
                });
            });
        }
    };
});
