'use strict'
define(function (require) {
	const module = require('components/staff_change/module')

	module.directive('debugPanel', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/debug_panel.html'
			}
		}
	])
})
