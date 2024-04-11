'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('jobChangeList', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/tabs/job_change_list.html'
			}
		}
	])
})
