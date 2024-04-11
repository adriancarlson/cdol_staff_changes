'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('nameChange', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/forms/name_change.html'
			}
		}
	])
})
