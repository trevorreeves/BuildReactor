import BuildServiceBase from 'core/services/buildServiceBase';
import Rx from 'rx/dist/rx.testing';

var onNext = Rx.ReactiveTest.onNext;
var onCompleted = Rx.ReactiveTest.onCompleted;
var onError = Rx.ReactiveTest.onError;

describe('core/services/buildServiceBase', function() {

	var scheduler;
	var settings, serviceInfo, service;
	var update1Response, update2Response;
	var buildState1, buildState2;

	beforeEach(function() {
		scheduler = new Rx.TestScheduler();
		// scheduler.scheduleAbsolute(null, 2000, function() {
		// 	scheduler.stop();
		// });
		settings = {
			typeName: 'custom',
			baseUrl: 'prefix',
			url: 'http://example.com/',
			name: 'Service name',
			projects: ['Build1', 'Build2'],
			updateInterval: 1
		};
		serviceInfo = {
			typeName: 'custom',
			baseUrl: 'prefix',
			urlHint: 'URL',
			icon: 'src/core/services/custom/icon.png',
			logo: 'src/core/services/custom/logo.png',
			defaultConfig: {
				baseUrl: 'prefix',
				name: '',
				projects: [],
				url: '',
				username: '',
				password: '',
				branch: '',
				updateInterval: 60
			}
		};
		buildState1 = createStateForId('Build1');
		buildState2 = createStateForId('Build2');
		update1Response = Rx.Observable.return(buildState1);
		update2Response = Rx.Observable.return(buildState2);
		var callCount = 0;
		spyOn(GenericBuild.prototype, 'update').and.callFake(function() {
			switch (this.id) {
			case 'Build1':
				return update1Response;
			case 'Build2':
				return update2Response;
			}
			return null;
		});
		service = new CustomBuildService(settings);
	});

	function CustomBuildService() {
		Object.assign(this, new BuildServiceBase(settings, serviceInfo, scheduler));
		this.Build = GenericBuild;
	}

	function GenericBuild(id, settings) {
		this.id = id;
		this.settings = settings;
	}
	GenericBuild.prototype.update = function() {};

	function createStateForId(id) {
		return {
			id: id,
			name: 'Build name ' + id,
			group: 'Group name',
			webUrl: 'http://example.com/build' + id,
			isBroken: false,
			isRunning: false,
			isDisabled: false,
			serviceName: settings.name,
			serviceIcon: serviceInfo.icon,
			tags: [],
			changes: []
		};
	}

	describe('updateAll', function() {

		it('should update builds', function() {
			var result = scheduler.startScheduler(function() {
				return service.updateAll();
			});

			expect(result.messages).toHaveEqualElements(
				onNext(200, buildState1),
				onNext(200, buildState2),
				onCompleted(200)
			);
			expect(GenericBuild.prototype.update.calls.count()).toBe(settings.projects.length);
		});

		it('should complete when no builds selected', function() {
			settings.projects = [];
			service = new CustomBuildService(settings);

			var result = scheduler.startScheduler(function() {
				return service.updateAll();
			});

			expect(result.messages).toHaveEqualElements(onCompleted(200));
		});

		describe('error handling', function() {

			it('should push state if build update failed with AjaxError', function() {
				update2Response = new Rx.Subject();
				var error = {
					name: 'AjaxError',
					message: 'Ajax call failed',
					url: 'http://example.com/'
				};

				scheduler.scheduleAbsolute(null, 300, function() {
					update2Response.onError(error);
				});
				var result = scheduler.startScheduler(function() {
					return service.updateAll();
				});

				const errorValue = result.messages[1].value.value.error;
				expect(errorValue).toEqual({
					name: 'AjaxError',
					message: 'Ajax call failed',
					description: 'Ajax call failed',
					url: 'http://example.com/',
					httpStatus: undefined,
					stack: undefined
				});
			});

			it('should push state if build update failed with JS error', function() {
				update2Response = new Rx.Subject();
				var error = new Error('Function call failed');

				scheduler.scheduleAbsolute(null, 300, function() {
					update2Response.onError(error);
				});
				var result = scheduler.startScheduler(function() {
					return service.updateAll();
				});

				const errorDetails = result.messages[1].value.value.error;
				expect(errorDetails.name).toBe('Error');
				expect(errorDetails.message).toBe('Function call failed');
			});

			it('should push state if build update failed with string error', function() {
				update2Response = new Rx.Subject();
				var error = 'error';

				scheduler.scheduleAbsolute(null, 300, function() {
					update2Response.onError(error);
				});
				var result = scheduler.startScheduler(function() {
					return service.updateAll();
				});

				const errorDetails = result.messages[1].value.value.error;
				expect(errorDetails.name).toBe('UnknownError');
				expect(errorDetails.message).toBe('"error"');
			});

			it('should push state if build update failed with object error', function() {
				update2Response = new Rx.Subject();
				var error = { errorCode: 111 };

				scheduler.scheduleAbsolute(null, 300, function() {
					update2Response.onError(error);
				});
				var result = scheduler.startScheduler(function() {
					return service.updateAll();
				});

				const errorDetails = result.messages[1].value.value.error;
				expect(errorDetails.name).toBe('UnknownError');
				expect(errorDetails.message).toBe('{"errorCode":111}');
			});

		});
	});

	describe('start/stop', function() {

		afterEach(function() {
			service.stop();
		});

		it('should fail if updateInterval not defined', function() {
			delete settings.updateInterval;

			expect(function() {
				service.start();
			}).toThrowError('updateInterval not defined');
		});

		// TODO: !(TestScheduler instanceof Scheduler) ?
		xit('should push serviceStarted on first finished update', function() {
			scheduler.scheduleAbsolute(null, 500, function() {
				service.start().subscribe();
			});
			var result = scheduler.startScheduler(function() {
				return service.events;
			});

			expect(result.messages).toHaveEqualElements(
				onNext(501, {
					eventName: 'serviceStarted',
					source: settings.name,
					details: [buildState1, buildState2]
				}
			));
		});

		// TODO: !(TestScheduler instanceof Scheduler) ?
		xit('should start only once', function() {
			scheduler.scheduleAbsolute(null, 300, function() {
				service.start().subscribe();
			});
			scheduler.scheduleAbsolute(null, 500, function() {
				service.start().subscribe();
			});
			var result = scheduler.startScheduler(function() {
				return service.events;
			});

			expect(result.messages).toHaveEqualElements(
				onNext(301, {
					eventName: 'serviceStarted',
					source: settings.name,
					details: [buildState1, buildState2]
				})
			);
		});

		// TODO: !(TestScheduler instanceof Scheduler) ?
		xit('should push serviceStopped on stop', function() {
			scheduler.scheduleAbsolute(null, 300, function() {
				service.start().subscribe();
			});
			scheduler.scheduleAbsolute(null, 500, function() {
				service.stop();
			});
			var result = scheduler.startScheduler(function() {
				return service.events;
			});

			expect(result.messages).toHaveEqualElements(
				onNext(301, {
					eventName: 'serviceStarted',
					source: settings.name,
					details: [buildState1, buildState2]
				}),
				onNext(500, { eventName: 'serviceStopped', source: settings.name })
			);
		});

		it('should not push serviceStopped if not started', function() {
			scheduler.scheduleAbsolute(null, 500, function() {
				service.stop();
			});
			var result = scheduler.startScheduler(function() {
				return service.events;
			});

			expect(result.messages).not.toHaveEvent('serviceStopped');
		});

	});

});
