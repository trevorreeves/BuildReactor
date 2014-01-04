require.config({
	baseUrl: 'src',
});

require(['common/main'], function (common) {
	'use strict';
	require(['common/main-web'], function (common) {
		require(['dashboard/main-app']);
	});
});
