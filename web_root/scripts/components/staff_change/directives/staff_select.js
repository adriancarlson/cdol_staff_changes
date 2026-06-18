'use strict'
define(function (require) {
	var module = require('components/staff_change/module')

	module.directive('staffSelect', [
		'$timeout',
		function ($timeout) {
			return {
				restrict: 'A',
				require: 'ngModel',
				link: function (scope, element, attrs) {
					let destroyed = false
					let pendingRefresh

					const destroySelect = () => {
						const selectElement = $j(element[0])
						if (selectElement.hasClass('select2-hidden-accessible')) selectElement.select2('destroy')
					}

					const initializeSelect = () => {
						if (pendingRefresh) $timeout.cancel(pendingRefresh)

						require(['https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js'], function () {
							pendingRefresh = $timeout(function () {
								if (destroyed) return

								const selectElement = $j(element[0])
								destroySelect()
								selectElement.select2({
									theme: 'bootstrap-5',
									width: '100%',
									placeholder: attrs.placeholder || '',
									allowClear: true,
									selectionCssClass: 'select2--small',
									dropdownCssClass: 'select2--small'
								})

								// Refresh Select2's display without changing Angular's current model value.
								selectElement.trigger('change.select2')
							})
						})
					}

					const stopWatching = scope.$watchCollection(attrs.staffSelect, initializeSelect)

					scope.$on('$destroy', function () {
						destroyed = true
						stopWatching()
						if (pendingRefresh) $timeout.cancel(pendingRefresh)
						destroySelect()
					})
				}
			}
		}
	])
})
