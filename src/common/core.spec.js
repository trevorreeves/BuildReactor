define([
	'common/core',
	'common/chromeApi',
	'rx',
	'test/rxHelpers',
	'rx.binding'
], function (core, chromeApi, Rx) {

	'use strict';

	describe('common/core', function () {

		var onNext = Rx.ReactiveTest.onNext;
		var scheduler;
		var port;

		beforeEach(function () {
			scheduler = new Rx.TestScheduler();
			port = {
				onMessage: {
					addListener: function () {}
				}
			};
			spyOn(chromeApi, 'connect').andReturn(port);
			spyOn(chromeApi, 'sendMessage');
			spyOn(port.onMessage, 'addListener');
		});

		it('should connect on init', function () {
			core.init();

			expect(chromeApi.connect.argsForCall[0]).toEqual([{ name: 'state' }]);
			expect(chromeApi.connect.argsForCall[1]).toEqual([{ name: 'configuration' }]);
		});

		it('should pass activeProjects from port', function () {
			var state = [{ name: 'service1' }, { name: 'service2' }];
			port.onMessage.addListener.andCallFake(function (listener) {
				listener(state);
			});

			scheduler.scheduleAbsolute(300, function () {
				core.init();
			});
			var result = scheduler.startWithCreate(function () {
				return core.activeProjects;
			});

			expect(result.messages).toHaveElements(onNext(300, state));
		});

		it('should pass configurations from port', function () {
			var config = [{ name: 'service1' }, { name: 'service2' }];
			port.onMessage.addListener.andCallFake(function (listener) {
				listener(config);
			});

			scheduler.scheduleAbsolute(300, function () {
				core.init();
			});
			var result = scheduler.startWithCreate(function () {
				return core.configurations;
			});

			expect(result.messages).toHaveElements(onNext(300, config));
		});

		it('should send availableServices message', function () {
			var callback = function () {};

			core.availableServices(callback);

			expect(chromeApi.sendMessage).toHaveBeenCalledWith({name: "availableServices"}, callback);
		});

		it('should send availableProjects message', function () {
			var settings = [];
			var callback = function () {};

			core.availableProjects(settings, callback);

			expect(chromeApi.sendMessage).toHaveBeenCalledWith({name: "availableProjects", serviceSettings: settings}, callback);
		});

		it('should send updateSettings message', function () {
			var settings = [];

			core.updateSettings(settings);

			expect(chromeApi.sendMessage).toHaveBeenCalledWith({name: "updateSettings", settings: settings});
		});

		it('should send enableService message', function () {
			core.enableService('service');

			expect(chromeApi.sendMessage).toHaveBeenCalledWith({name: "enableService", serviceName: 'service'});
		});

		it('should send disableService message', function () {
			core.disableService('service');

			expect(chromeApi.sendMessage).toHaveBeenCalledWith({name: "disableService", serviceName: 'service'});
		});

		it('should send removeService message', function () {
			core.removeService('service');

			expect(chromeApi.sendMessage).toHaveBeenCalledWith({name: "removeService", serviceName: 'service'});
		});

		it('should send renameService message', function () {
			core.renameService('service', 'new service');

			expect(chromeApi.sendMessage).toHaveBeenCalledWith({
				name: "renameService",
				oldName: 'service',
				newName: 'new service'
			});
		});


	});

});