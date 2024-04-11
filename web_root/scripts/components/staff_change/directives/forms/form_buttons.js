'use strict'
define(function (require) {
	let module = require('components/staff_change/module')

	module.directive('formButtons', [
		function () {
			return {
				templateUrl: '/admin/staff_change/views/forms/form_buttons.html'
			}
		}
	])
})
