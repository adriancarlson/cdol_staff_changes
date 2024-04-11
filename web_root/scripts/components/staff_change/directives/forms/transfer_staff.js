'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('transferStaff', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/forms/transfer_staff.html'
			}
		}
	])
})
