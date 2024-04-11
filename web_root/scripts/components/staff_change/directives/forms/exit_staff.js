'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('exitStaff', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/forms/exit_staff.html'
			}
		}
	])
})
