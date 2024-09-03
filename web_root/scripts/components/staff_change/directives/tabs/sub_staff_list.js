'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('subStaffList', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/tabs/sub_staff_list.html'
			}
		}
	])
})
