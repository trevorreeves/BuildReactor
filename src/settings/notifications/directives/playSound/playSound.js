import soundDefs from 'core/config/soundDefinitions'
import app from 'settings/app';
import soundDriver from 'core/soundDriver';
import template from 'settings/notifications/directives/playSound/playSound.html';
import howler from 'howler'

export default app.directive('playSound', () => {
    return {
        scope: {
            soundSrc: '=',
            alwaysReload: '=',
            disabled: '='
        },
        templateUrl: template,
        controller($scope, $element, $attrs, $transclude) {

            $scope.currentSoundState = 'finished';
            $scope.message = 'play sound';
            
            var soundHandle = null;
            var playId = null;
            var initialize = function()
            {
                if (soundHandle !== null && !$scope.alwaysReload) return;

                soundHandle = new howler.Howl({ 
                    src: [$scope.soundSrc],
                    preload: false
                });

                soundHandle.on('loaderror', function(id, error) {
                    $scope.currentSoundState = 'errored';
                    $scope.message = 'Failed to load sound : ' + error;
                    soundHandle.unload();
                    soundHandle = null;
                    $scope.$digest();
                });

                soundHandle.load();
            }

            var play = function() {
                playId = soundHandle.play();
                $scope.currentSoundState = 'playing';

                soundHandle.on('play', function() { 
                    $scope.currentSoundState = 'playing';
                    $scope.message = 'pause sound';
                    $scope.$digest(); /* seems to be needed to ensure DOM is updated reliably. */
                 }, playId);

                soundHandle.on('pause', function() { 
                    $scope.currentSoundState = 'paused';
                    $scope.message = 'play sound';
                    $scope.$digest();
                 }, playId);

                soundHandle.on('end', function () {
                    $scope.currentSoundState = 'finished';
                    $scope.message = 'play sound';
                    playId = null;
                    $scope.$digest();
                }, playId);
            }

            var pause = function() {
                soundHandle.pause(playId);
            }

            $scope.togglePlay = function() {
                initialize();

                if (soundHandle.playing(playId)) {
                    pause();
                } else {
                    if (soundHandle.state() !== 'loaded')
                    {
                        soundHandle.on('load', function() {
                            play();
                        });
                    } else {
                        play();
                    }
                }
            }
        }
    };
});
