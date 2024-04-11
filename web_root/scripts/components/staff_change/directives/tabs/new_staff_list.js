'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('newStaffList', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/tabs/new_staff_list.html'
			}
		}
	])
})
