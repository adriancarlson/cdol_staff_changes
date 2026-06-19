'use strict'
define(function (require) {
	const module = require('components/staff_change/module')

	module.directive('transferStaffList', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/tabs/transfer_staff_list.html'
			}
		}
	])
})
