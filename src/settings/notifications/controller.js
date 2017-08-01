import angular from 'angular';
import app from 'settings/app';
import core from 'common/core';

import 'settings/notifications/directives/soundLibrary/soundLibrary';
import 'settings/notifications/directives/soundRule/soundRule';

export default app.controller('NotificationsCtrl', ($scope) => {
	core.views.subscribe((config) => {
		$scope.$evalAsync(() => {
			$scope.config = config;
		});
	});

	$scope.currentTab = 'cards';

    $scope.setTab = function(newTab) {
      $scope.currentTab = newTab;
    };

    $scope.isCurrentTab = function(tabName) {
      return $scope.currentTab === tabName;
    };

	$scope.setField = function(owner, name, value) {
		if (!$scope.config.notifications[owner]) return;
		
		const changed = $scope.config.notifications[owner][name] !== value;
		if (changed) {
			$scope.config.notifications[owner][name] = value;
			core.setViews(angular.copy($scope.config));
		}
	};

	$scope.setSoundEvent = function(eventName, enabled, soundName) {
		var eventConfig = $scope.config.notifications.sounds.events[eventName];
		if (!eventConfig) return;

		eventConfig.enabled = enabled;
		//eventConfig.soundName = soundName;
		core.setViews(angular.copy($scope.config));
	};
});
