'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('start', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/forms/start.html'
			}
		}
	])
})
