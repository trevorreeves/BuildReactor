import joinUrl from 'common/joinUrl';

define([
	'core/services/buildServiceBase',
	'core/services/request',
	'jquery',
	'rx'
], function(BuildServiceBase, request, $, Rx) {

	'use strict';

	var CCBuildService = function(settings, serviceInfo = CCBuildService.settings()) {
		Object.assign(this, new BuildServiceBase(settings, serviceInfo));
		this.availableBuilds = availableBuilds;
		this.updateAll = updateAll;
		this.cctrayLocation = '';
		this.serviceInfo = serviceInfo;
	};

	CCBuildService.settings = function() {
		return {
			typeName: 'CCTray Generic',
			baseUrl: 'cctray',
			icon: 'core/services/cctray/icon.png',
			logo: 'core/services/cctray/logo.png',
			defaultConfig: {
				baseUrl: 'cctray',
				name: '',
				projects: [],
				url: '',
				username: '',
				password: '',
				updateInterval: 60
			}
		};
	};

	var updateAll = function() {
		var self = this;
		return request.xml({
			url: joinUrl(this.settings.url, this.cctrayLocation),
			username: this.settings.username,
			password: this.settings.password,
			parser: parseProjects
		}).catch(function(ex) {
			return Rx.Observable.fromArray(self.settings.projects)
				.select(function(buildId) {
					return {
						id: buildId,
						error: ex
					};
				}).toArray();
		}).selectMany(function(projects) {
			return Rx.Observable.fromArray(projects);
		}).where(function(build) {
			return self.settings.projects.includes(build.id);
		}).defaultIfEmpty([]);
	};

	var parseProjects = function(projectsXml) {
		return $(projectsXml)
			.find('Project')
			.map(function(i, d) {
				var status = $(d).attr('lastBuildStatus');
				var breakers = $(d).find('message[kind=Breakers]').attr('text');
				var name = $(d).attr('name');
				var state = {
					id: name,
					name: name,
					group: $(d).attr('category'),
					webUrl: $(d).attr('webUrl'),
					isRunning: $(d).attr('activity') === 'Building',
					isWaiting: status === 'Pending',
					tags: [],
					changes: breakers ? breakers.split(', ').map(function(breaker) {
						return { name: breaker };
					}) : []
				};
				if (status in { 'Success': 1, 'Failure': 1, 'Exception': 1 }) {
					state.isBroken = status in { 'Failure': 1, 'Exception': 1 };
				} else if (status !== 'Unknown') {
					state.tags.push({ name : 'Unknown', description : 'Status [' + status + '] is unknown' });
				}

				return state;
			}).map(categoriseFromName)
			.toArray();
	};

	var categoriseFromName = function(i, d) {
		if (!d.group && d.name.split(' :: ').length > 1) {
			var nameParts = d.name.split(' :: ');
			d.group = nameParts[0];
			d.name = nameParts.slice(1).join(' :: ');
		}
		return d;
	};

	var availableBuilds = function() {
		return request.xml({
			url: joinUrl(this.settings.url, this.cctrayLocation),
			username: this.settings.username,
			password: this.settings.password,
			parser: parseAvailableBuilds
		});
	};

	function parseAvailableBuilds(projectsXml) {
		return {
			items: $(projectsXml)
				.find('Project')
				.map(function(i, project) {
					return {
						id: $(project).attr('name'),
						name: $(project).attr('name'),
						group: $(project).attr('category') || null,
						isDisabled: false
					};
				}).map(categoriseFromName)
				.toArray()
		};
	}

	return CCBuildService;
});
