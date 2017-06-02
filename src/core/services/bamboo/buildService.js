import joinUrl from 'common/joinUrl';
import sortBy from 'common/sortBy';

define([
	'core/services/buildServiceBase',
	'core/services/request',
	'core/services/bamboo/bambooPlan',
	'rx'
], function(BuildServiceBase, request, BambooPlan, Rx) {

	'use strict';

	var BambooBuildService = function(settings) {
		Object.assign(this, new BuildServiceBase(settings, BambooBuildService.settings()));
		this.Build = BambooPlan;
		this.availableBuilds = availableBuilds;
	};

	BambooBuildService.settings = function() {
		return {
			typeName: 'Atlassian Bamboo',
			baseUrl: 'bamboo',
			icon: 'core/services/bamboo/icon.png',
			logo: 'core/services/bamboo/logo.png',
			fields: [
                {
					type: 'url',
					name: 'Server URL, e.g. http://ci.openmrs.org/',
					help: 'For Bamboo OnDemand use https://[your_account].atlassian.net/builds'
				},
				{ type: 'username' },
                { type: 'password' }
            ],
			defaultConfig: {
				baseUrl: 'bamboo',
				name: '',
				projects: [],
				url: '',
				username: '',
				password: '',
				updateInterval: 60
			}
		};
	};

	var availableBuilds = function() {
		var self = this;
		return allProjects(self)
			.selectMany(function(project) {
				return allProjectPlans(self, project);
			})
			.select(function(plan) {
				return {
					id: plan.key,
					name: plan.shortName,
					group: plan.projectName,
					isDisabled: !plan.enabled
				};
			})
			.toArray()
			.select(function(plans) {
				sortBy('id', plans);
				return {
					items: plans
				};
			});
	};

	var projectsFromIndex = function(self, startIndex) {
		return sendRequest(self, 'rest/api/latest/project', {
			expand: 'projects.project.plans.plan',
			'start-index': startIndex
		});
	};

	var projectPlansFromIndex = function(self, projectKey, startIndex) {
		return sendRequest(self, 'rest/api/latest/project/' + projectKey, {
			expand: 'plans.plan',
			'start-index': startIndex
		});
	};

	var sendRequest = function(self, urlPath, data) {
		if (self.settings.username) {
			data.os_authType = 'basic';
		} else {
			data.os_authType = 'guest';
		}
		return request.json({
			url: joinUrl(self.settings.url, urlPath),
			data: data,
			username: self.settings.username,
			password: self.settings.password
		});
	};

	var allProjects = function(self) {
		return projectsFromIndex(self, 0).selectMany(function(response) {
			var result = Rx.Observable.return(response);
			var pageSize = response.projects['max-result'];
			var totalSize = response.projects['size'];
			var pageIndexes = getPageIndexes(pageSize, totalSize);
			var moreProjects = Rx.Observable.fromArray(pageIndexes).selectMany(function(index) {
				return projectsFromIndex(self, index);
			});
			return Rx.Observable.return(response).concat(moreProjects);
		}).selectMany(function(projectResponse) {
			return Rx.Observable.fromArray(projectResponse.projects.project);
		});
	};

	var getPageIndexes = function(pageSize, totalSize) {
		var pageIndexes = [];
		for (var index = pageSize; index < totalSize; index += pageSize) {
			pageIndexes.push(index);
		}
		return pageIndexes;
	};

	var allProjectPlans = function(self, project) {
		var pageSize = project.plans['max-result'];
		var totalSize = project.plans['size'];
		var pageIndexes = getPageIndexes(pageSize, totalSize);
		var morePlans = Rx.Observable.fromArray(pageIndexes).selectMany(function(index) {
			return projectPlansFromIndex(self, project.key, index);
		}).selectMany(function(response) {
			return Rx.Observable.fromArray(response.plans.plan);
		});
		return Rx.Observable.fromArray(project.plans.plan).concat(morePlans);
	};

	return BambooBuildService;
});
