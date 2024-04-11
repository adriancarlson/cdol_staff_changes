'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('tests', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/tests.html'
			}
		}
	])
})
