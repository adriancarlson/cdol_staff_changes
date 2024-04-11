'use strict'
define(function (require) {
	var module = require('components/staff_change/module')

	//defining our controller and naming it serviceHourCtrl and loading $scope as a dependency
	module.controller('staffChangeListCtrl', [
		'$scope',
		'$attrs',
		'pqService',
		function ($scope, $attrs, pqService) {
			$scope.staffChangeCounts = []
			$scope.staffList = {}
			$scope.curSchoolId = $attrs.ngCurSchoolId
			$scope.curYearId = $attrs.ngCurYearId
			$scope.curDate = $attrs.ngCurDate
			$scope.calendarYear = new Date().getFullYear()
			$scope.selectedTab = document.querySelector('[aria-selected="true"]').getAttribute('data-context')
			$scope.booleanMap = { Yes: true, No: false }

			$scope.loadData = async changeType => {
				loadingDialog()
				//only make API call to get the data if
				if (!$scope.staffList.hasOwnProperty(changeType)) {
					//setting up arguments for PQ call
					const pqData = { curSchoolID: $scope.curSchoolId, calendarYear: $scope.calendarYear }

					// getting staff counts
					const countRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.counts', pqData)
					$scope.staffChangeCounts = countRes[0]

					// adding new new change type key/value pair for PQ call to staff list
					pqData.changeType = changeType

					//setting up function to add key and value staff list to staffList object
					const updateStaffList = (key, value) => ($scope.staffList[key] = value)

					// getting staff List for current change type
					const res = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', pqData)

					//updating staffList obj
					if (res.length > 0) {
						updateStaffList(changeType, res)
						const keys = ['ps', 'ad', 'o365', 'lms']

						$scope.staffList[changeType].forEach(item => {
							keys.forEach(key => {
								item[`${key}_complete`] = item[`${key}_created`] == 1 || item[`${key}_ignored`] == 1
							})
						})
					} else {
						$scope.staffList[changeType] = {}
					}

					$scope.$digest()

					//setting left nav count
					$j('#cdol-staff-count').text(`Staff Changes (${$scope.staffChangeCounts.total_remaining})`)
				}
				closeLoading()
			}

			// fire the function to load the data
			$scope.loadData($scope.selectedTab)

			// grab selected tab reload data and have the selected tab display data
			$scope.reloadData = () => {
				$scope.staffChangeCounts = []
				$scope.staffList = {}
				$scope.selectedTab = document.querySelector('[aria-selected="true"]').getAttribute('data-context')
				$scope.loadData($scope.selectedTab)
			}
		}
	])
})
