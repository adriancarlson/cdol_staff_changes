'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('creationChecks', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/forms/creation_checks.html'
			}
		}
	])
})
