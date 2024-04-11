'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('newStaff', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/forms/new_staff.html'
			}
		}
	])
})
