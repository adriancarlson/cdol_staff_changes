'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('allStaffList', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/tabs/all_staff_list.html'
			}
		}
	])
})
