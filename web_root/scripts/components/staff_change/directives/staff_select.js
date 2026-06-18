'use strict'
define(function (require) {
	const module = require('components/staff_change/module')

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
						selectElement.off('.staffSelect')
						if (selectElement.hasClass('select2-hidden-accessible')) selectElement.select2('destroy')
					}

					const focusSearchInput = () => {
						const focusVisibleSearchInput = () => {
							const searchInput = $j('.select2-container--open .select2-search__field').last()[0]
							if (searchInput) searchInput.focus()
						}

						// Native focus is more reliable than triggering jQuery focus with Select2 4.1.
						focusVisibleSearchInput()
						$timeout(focusVisibleSearchInput)
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
									selectionCssClass: 'select2--small',
									dropdownCssClass: 'select2--small'
								})
								selectElement.next('.select2-container').css({
									flex: '1 1 auto',
									minWidth: '0',
									width: 'auto'
								})
								selectElement.on('select2:open.staffSelect', focusSearchInput)

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
