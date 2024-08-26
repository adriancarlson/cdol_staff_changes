'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('subStaff', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/forms/sub_staff.html'
			}
		}
	])
})
