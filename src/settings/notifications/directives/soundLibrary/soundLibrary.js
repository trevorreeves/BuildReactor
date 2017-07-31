import soundLibrary from 'core/soundLibrary';
import soundDefs from 'core/config/soundDefinitions'
import app from 'settings/app';
import core from 'common/core';
import soundDriver from 'core/soundDriver';
import template from 'settings/notifications/directives/soundLibrary/soundLibrary.html';

import 'settings/notifications/directives/playSound/playSound';

export default app.directive('soundLibrary', () => {
    return {
        scope: {
            sounds: '=',
        },
        templateUrl: template,
        controller($scope, $element, $attrs, $transclude) {

            $scope.newSoundName = null;
            $scope.newSoundSrc = null;

            core.views.subscribe((config) => {
                $scope.$evalAsync(() => {
                    $scope.sounds = config.notifications.sounds.library;
                    $scope.config = config;
                });
            });

            $scope.soundIsDeletable = function(sound)
            {
                return sound.type !== soundDefs.SoundTypes.Bundled;
            }

            $scope.newSoundIsValid = function() {
                return $scope.newSoundName && $scope.newSoundName.length > 0 &&
                       $scope.newSoundSrc && $scope.newSoundSrc.length > 0;
            }

            $scope.addNewSound = function() {
                var info = new soundDefs.SoundInfo($scope.newSoundName, $scope.newSoundSrc, soundDefs.SoundTypes.Remote);
                info.isDeletable = function() { return true; }
                $scope.sounds.push(info);
                $scope.newSoundName = null;
                $scope.newSoundSrc = null;
                core.setViews(angular.copy($scope.config));
            }

            $scope.deleteSound = function(sound) {
                var i = $scope.sounds.findIndex(function(soundInfo) {
                    return soundInfo.name === sound.name && soundInfo.src === sound.src;
                });

                $scope.sounds.splice(i, 1);
                core.setViews(angular.copy($scope.config));
            }
        }
    };
});
