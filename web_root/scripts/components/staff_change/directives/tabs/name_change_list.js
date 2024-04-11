'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('nameChangeList', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/tabs/name_change_list.html'
			}
		}
	])
})
