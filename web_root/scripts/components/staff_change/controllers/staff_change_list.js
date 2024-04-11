'use strict'
define(function (require) {
	var module = require('components/staff_change/module')

	//defining our controller and naming it serviceHourCtrl and loading $scope as a dependency
	module.controller('staffChangeListCtrl', [
		'$scope',
		'$attrs',
		'pqService',
		'formatService',
		function ($scope, $attrs, pqService, formatService) {
			$scope.staffChangeCounts = []
			$scope.staffList = {}
			$scope.curSchoolId = $attrs.ngCurSchoolId
			$scope.curYearId = $attrs.ngCurYearId
			$scope.curDate = $attrs.ngCurDate
			$scope.calendarYear = new Date().getFullYear()
			$scope.selectedTab = document.querySelector('[aria-selected="true"]').getAttribute('data-context')
			$scope.booleanMap = { Yes: true, No: false }
			$scope.titleMap = {
				'Mr.': 'Mr.',
				'Mrs.': 'Mrs.',
				'Ms.': 'Ms.',
				'Dr.': 'Dr.',
				'Fr.': 'Fr.',
				'Msgr.': 'Msgr.',
				'Sr.': 'Sr.',
				'Br.': 'Br.'
			}
			$scope.schoolMap = {
				'All Saints Catholic School Holdrege': 'All Saints Catholic School Holdrege',
				'Aquinas Catholic Elementary': 'Aquinas Catholic Elementary',
				'Aquinas Catholic Middle/High': 'Aquinas Catholic Middle/High',
				'Bishop Neumann Catholic Jr/Sr High School': 'Bishop Neumann Catholic Jr/Sr High School',
				'Blessed Sacrament School': 'Blessed Sacrament School',
				'Cathedral of the Risen Christ School': 'Cathedral of the Risen Christ School',
				'Falls City Sacred Heart Elementary': 'Falls City Sacred Heart Elementary',
				'Falls City Sacred Heart Jr/Sr High School': 'Falls City Sacred Heart Jr/Sr High School',
				'Lourdes Central Catholic Elementary School': 'Lourdes Central Catholic Elementary School',
				'Lourdes Central Catholic Middle/High School': 'Lourdes Central Catholic Middle/High School',
				'North American Martyrs School': 'North American Martyrs School',
				'Pius X High School': 'Pius X High School',
				'St. Andrew Tecumseh': 'St. Andrew Tecumseh',
				'St. Cecilia Middle & High School': 'St. Cecilia Middle & High School',
				'St. James Crete': 'St. James Crete',
				'St. John Lincoln': 'St. John Lincoln',
				'St. John Nepomucene Weston': 'St. John Nepomucene Weston',
				'St. John the Baptist School': 'St. John the Baptist School',
				'St. Joseph Beatrice': 'St. Joseph Beatrice',
				'St. Joseph Lincoln': 'St. Joseph Lincoln',
				'St. Joseph York': 'St. Joseph York',
				'St. Michael Hastings': 'St. Michael Hastings',
				'St. Michael Lincoln': 'St. Michael Lincoln',
				'St. Patrick Lincoln': 'St. Patrick Lincoln',
				'St. Patrick McCook': 'St. Patrick McCook',
				'St. Peter Catholic School': 'St. Peter Catholic School',
				'St. Teresa Elementary School': 'St. Teresa Elementary School',
				'St. Vincent de Paul Seward': 'St. Vincent de Paul Seward',
				'St. Wenceslaus Wahoo': 'St. Wenceslaus Wahoo',
				'Villa Marie School': 'Villa Marie School'
			}

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
					let res = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', pqData)

					//updating staffList obj
					if (res.length > 0) {
						updateStaffList(changeType, res)
						const keys = ['ps', 'ad', 'o365', 'lms']

						$scope.staffList[changeType].forEach(item => {
							keys.forEach(key => {
								item[`${key}_complete`] = item[`${key}_created`] == 1 || item[`${key}_ignored`] == 1
							})

							Object.keys(item).forEach(key => {
								if (key.endsWith('_date')) {
									item[key] = new Date(formatService.formatDateFromApi(item[key]))
								}
							})

							if (item.final_completion_date) {
								item.completed = true
							} else {
								item.completed = false
							}
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
				// $scope.schoolMap ={}
				$scope.selectedTab = document.querySelector('[aria-selected="true"]').getAttribute('data-context')
				$scope.loadData($scope.selectedTab)
			}
		}
	])
})
