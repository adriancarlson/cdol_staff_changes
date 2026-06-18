'use strict'
define(function (require) {
	const module = require('components/staff_change/module')

	module.directive('exportButton', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/tabs/export_button.html'
			}
		}
	])
})
