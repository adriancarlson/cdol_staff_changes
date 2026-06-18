'use strict'
define(function (require) {
	// Loading these files registers both controllers on the shared AngularJS module before the page bootstraps.
	require('components/staff_change/controllers/staff_change')
	require('components/staff_change/controllers/staff_change_list')
})
