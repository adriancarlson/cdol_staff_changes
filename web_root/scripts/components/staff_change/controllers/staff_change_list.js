'use strict'
define(function (require) {
	var module = require('components/staff_change/module')

	module.controller('staffChangeListCtrl', [
		'$scope',
		'$attrs',
		'pqService',
		'formatService',
		function ($scope, $attrs, pqService, formatService) {
			//This is here for troubleshooting purposes.
			//Allows us to double click anywhere on the page and logs scope to console
			$j(document).dblclick(() => console.log($scope))

			$scope.staffChangeCounts = []
			$scope.staffList = {}
			$scope.curSchoolId = $attrs.ngCurSchoolId
			$scope.curYearId = $attrs.ngCurYearId
			$scope.curDate = new Date($attrs.ngCurDate)
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
			$scope.changeMap = {
				'New Staff': 'newStaff',
				'Transferring-In Staff': 'transferringStaff',
				'Job Change': 'jobChange',
				Substitute: 'subStaff',
				'Name Change': 'nameChange',
				'Exiting Staff': 'exitingStaff'
			}

			$scope.schoolMap = {
				'All Saints Catholic School Holdrege': 'All Saints Catholic School Holdrege',
				'Aquinas Catholic Elementary': 'Aquinas Catholic Elementary',
				'Aquinas Catholic Middle/High': 'Aquinas Catholic Middle/High',
				'Bishop Neumann Catholic Jr/Sr High School': 'Bishop Neumann Catholic Jr/Sr High School',
				'Blessed Sacrament School': 'Blessed Sacrament School',
				'Cathedral of the Risen Christ School': 'Cathedral of the Risen Christ School',
				'Diocesan Office': 'Diocesan Office',
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
			$scope.subTypeMap = {
				FSTS: 'FSTS',
				LTS: 'LTS'
			}

			$scope.getReqNotationClass = (changeType, curDate) => {
				if (changeType.completion_date >= curDate) return ''

				const needsCanva = changeType.canva_transfer == '1' && !changeType.canva_complete

				if (changeType.sub_type === 'FSTS') {
					return !changeType.ad_complete || !changeType.o365_complete || needsCanva ? 'req-notation' : ''
				}

				if (changeType.change_type === 'exitingStaff' || changeType.change_type === 'jobChange') {
					return !changeType.ps_complete || !changeType.ad_complete || needsCanva ? 'req-notation' : ''
				}

				if (changeType.change_type === 'newStaff' || changeType.change_type === 'transferringStaff') {
					return !changeType.ps_complete || !changeType.ad_complete || !changeType.o365_complete || !changeType.lms_complete || !changeType.canva_complete ? 'req-notation' : ''
				}

				return !changeType.ps_complete || !changeType.ad_complete || !changeType.o365_complete || !changeType.lms_complete || needsCanva ? 'req-notation' : ''
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
						const keys = ['ps', 'ad', 'o365', 'lms', 'canva']

						$scope.staffList[changeType].forEach(item => {
							keys.forEach(key => {
								item[`${key}_complete`] = item[`${key}_created`] == 1 || item[`${key}_ignored`] == 1
							})

							// Check if change_type is 'subStaff' and sub_type is 'FSTS'
							if (item.change_type === 'subStaff' && item.sub_type === 'FSTS') {
								item.ps_complete = true
								item.lms_complete = true
							}
							if (item.change_type === 'exitingStaff' || item.change_type === 'jobChange') {
								item.lms_complete = true
							}

							if (item.change_type === 'nameChange' && item.canva_transfer === '0') {
								item.canva_complete = true
							}

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

							if (item.submission_time) {
								const submissionTime = item.submission_time

								// Splitting the time string into hours, minutes, and AM/PM parts
								const [time, period] = submissionTime.split(' ')
								const [hours, minutes] = time.split(':')

								// Convert hours to 24-hour format if it's PM and not noon
								let hours24 = parseInt(hours, 10)
								if (period === 'PM' && hours24 !== 12) {
									hours24 += 12
								} else if (period === 'AM' && hours24 === 12) {
									hours24 = 0 // Midnight
								}

								// Creating a Date object with today's date and the adjusted hours and minutes
								const submissionDate = new Date()
								submissionDate.setHours(hours24)
								submissionDate.setMinutes(parseInt(minutes, 10))
								submissionDate.setSeconds(0) // Optional: You can set seconds to zero if not required

								// Now, submissionDate holds the time in a format that can be sorted properly
								item.sort_time = submissionDate
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
	module.filter('changeTypeFilter', function () {
		const reverseMap = {
			newStaff: 'New Staff',
			exitingStaff: 'Exiting Staff',
			nameChange: 'Name Change',
			subStaff: 'Substitute',
			jobChange: 'Job Change',
			transferringStaff: 'Transferring-In Staff'
		}

		return function (input) {
			// Check if input is a valid string
			if (typeof input === 'string') {
				// Return the corresponding value from reverseMap or null if not found
				return reverseMap[input] || null
			} else {
				// Return input unchanged if it's not a string
				return input
			}
		}
	})
	module.filter('otherSchoolName', function () {
		const map = {
			130: 'Lourdes Central Catholic Elementary School',
			131: 'Lourdes Central Catholic Middle/High School',
			160: 'Aquinas Catholic Elementary',
			189: 'St. Michael Hastings',
			210: 'Falls City Sacred Heart Elementary',
			211: 'Falls City Sacred Heart Jr/Sr High School',
			264: 'Aquinas Catholic Middle/High',
			437: 'St. Cecilia Middle & High School'
		}
		return function (input) {
			return map[input] || ''
		}
	})
})
