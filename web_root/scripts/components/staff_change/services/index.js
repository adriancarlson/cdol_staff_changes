'use strict'
define(function (require) {
	// Requiring each module registers its singleton factory with the shared AngularJS application module.
	require('components/staff_change/services/jitbit_service')
	require('components/staff_change/services/format_service')
	require('components/staff_change/services/json_data_service')
	require('components/staff_change/services/ps_api_service')
})
