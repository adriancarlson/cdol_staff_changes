'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('exitStaffList', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/tabs/exit_staff_list.html'
			}
		}
	])
})
