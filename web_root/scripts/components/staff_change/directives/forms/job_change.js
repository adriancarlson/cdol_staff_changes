'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('jobChange', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/forms/job_change.html'
			}
		}
	])
})
