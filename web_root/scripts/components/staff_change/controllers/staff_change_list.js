'use strict'
define(function (require) {
	var module = require('components/staff_change/module')

	module.controller('staffChangeListCtrl', [
		'$scope',
		'$attrs',
		'$filter',
		'pqService',
		'formatService',
		function ($scope, $attrs, $filter, pqService, formatService) {
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
			$scope.changeType = ''
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
				$scope.changeType = changeType

				// Only fetch data from API if we haven't already cached it
				if (!$scope.staffList.hasOwnProperty(changeType)) {
					const pqData = { curSchoolID: $scope.curSchoolId, calendarYear: $scope.calendarYear }

					// Get staff counts
					const countRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.counts', pqData)
					$scope.staffChangeCounts = countRes[0]

					// Add changeType for PQ call
					pqData.changeType = changeType

					// Fetch staff list for this changeType
					const res = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', pqData)

					if (res.length > 0) {
						$scope.staffList[changeType] = res

						const keys = ['ps', 'ad', 'o365', 'lms', 'canva']

						$scope.staffList[changeType].forEach(item => {
							keys.forEach(key => {
								item[`${key}_complete`] = item[`${key}_created`] == 1 || item[`${key}_ignored`] == 1
							})

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

							item.completed = !!item.final_completion_date

							if (item.submission_time) {
								const [time, period] = item.submission_time.split(' ')
								const [hours, minutes] = time.split(':')
								let hours24 = parseInt(hours, 10)

								if (period === 'PM' && hours24 !== 12) hours24 += 12
								else if (period === 'AM' && hours24 === 12) hours24 = 0

								const submissionDate = new Date()
								submissionDate.setHours(hours24)
								submissionDate.setMinutes(parseInt(minutes, 10))
								submissionDate.setSeconds(0)

								item.sort_time = submissionDate
							}
						})
					} else {
						$scope.staffList[changeType] = {}
					}
				}

				// ✅ Always update listHeaders, even if data is cached
				let baseHeaders = ['School', 'Submitted By', 'Submission Date', 'Deadline']

				if ($scope.changeType === 'newStaff') {
					$scope.listHeaders = [$filter('changeTypeFilter')($scope.changeType), ...baseHeaders, 'PS Created', 'AD Created', 'O365 Created', 'LMS Created', 'Canva Created', 'Completion Date']
				} else if ($scope.changeType === 'transferringStaff') {
					$scope.listHeaders = [$filter('changeTypeFilter')($scope.changeType), 'New School', 'Original School', ...baseHeaders.slice(1), 'PS Moved', 'AD Moved', 'O365 Moved', 'LMS Moved', 'Canva Moved', 'Completion Date']
				} else if ($scope.changeType === 'jobChange') {
					$scope.listHeaders = ['Staff Name', 'Previous Position/Job', 'New Position/Job', ...baseHeaders, 'PS Changed', 'AD Changed', 'Completion Date']
				} else if ($scope.changeType === 'subStaff') {
					$scope.listHeaders = [
						$filter('changeTypeFilter')($scope.changeType) + ' Name',
						baseHeaders[0], // School
						'Sub Type',
						...baseHeaders.slice(1),
						'PS Created',
						'AD Created',
						'O365 Created',
						'LMS Created',
						'Completion Date'
					]
				} else if ($scope.changeType === 'nameChange') {
					$scope.listHeaders = ["Staff's New Name", "Staff's Previous Name", ...baseHeaders, 'Canva Transferred', 'PS Changed', 'AD Changed', 'O365 Changed', 'LMS Changed', 'Completion Date']
				} else if ($scope.changeType === 'exitingStaff') {
					$scope.listHeaders = [$filter('changeTypeFilter')($scope.changeType), ...baseHeaders, 'Canva Transferred', 'PS Deactivated', 'AD Deactivated', 'Completion Date']
				} else if ($scope.changeType === 'allStaff') {
					$scope.listHeaders = ['Staff Name', 'Change Type', ...baseHeaders, 'PS Complete', 'AD Complete', 'O365 Complete', 'LMS Complete', 'Completion Date']
				} else {
					// fallback
					$scope.listHeaders = [$filter('changeTypeFilter')($scope.changeType), ...baseHeaders, 'PS Created', 'AD Created', 'O365 Created', 'LMS Created', 'Canva Created', 'Completion Date']
				}

				$scope.$applyAsync()

				console.log('$scope.listHeaders', $scope.listHeaders)

				// Update nav count
				$j('#cdol-staff-count').text(`Staff Changes (${$scope.staffChangeCounts.total_remaining})`)

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

			$scope.exportGridData = () => {
				const changeType = $scope.changeType
				const listName = `filtered${changeType.charAt(0).toUpperCase()}${changeType.slice(1)}List`
				const data = $scope[listName]

				if (!Array.isArray(data) || data.length === 0) {
					alert('No data to export.')
					return
				}

				// Helper function to format names with title filtering
				const formatNameWithTitle = (titleField, firstNameField, lastNameField) => {
					return row => {
						const title = row[titleField] || ''
						const firstName = row[firstNameField] || ''
						const excludedTitlePrefixes = ['Fr.', 'Msgr.', 'Sr.', 'Br.']

						// Check if first name starts with any of the excluded religious titles
						const hasReligiousPrefix = excludedTitlePrefixes.some(prefix => firstName.startsWith(prefix))
						const displayTitle = title && !hasReligiousPrefix ? title : ''

						return `${displayTitle} ${firstName} ${row[lastNameField] || ''}`.trim()
					}
				}

				let fieldMap = [
					{
						label: changeType === 'allStaff' ? 'Staff Name' : $filter('changeTypeFilter')(changeType),
						key: formatNameWithTitle('title', 'first_name', 'last_name')
					},
					{ label: 'School', key: 'schname' },
					{ label: 'Submitted By', key: 'submittedstaff' },
					{ label: 'Submission Date', key: 'submission_date' },
					{ label: 'Submission Time', key: 'submission_time' },
					{ label: 'Deadline', key: 'completion_date' },
					{ label: 'PS Created', key: 'ps_complete' },
					{ label: 'AD Created', key: 'ad_complete' },
					{ label: 'O365 Created', key: 'o365_complete' },
					{ label: 'LMS Created', key: 'lms_complete' },
					{ label: 'Canva Created', key: 'canva_complete' },
					{ label: 'Completion Date', key: 'final_completion_date' },
					{ label: 'Notes', key: 'notes' },
					{ label: 'Microsoft License', key: 'license_microsoft' },
					{ label: 'Gender', key: 'gender' },
					{ label: 'DOB', key: 'dob' },
					{ label: 'Religion', key: 'religion' },
					{ label: 'Religious Clergy Lay', key: 'religiousclergylay' },
					{ label: 'Staff Type', key: 'staff_type_desc' },
					{ label: 'Position', key: 'position' },
					{ label: 'FTE', key: 'fte' },
					{ label: 'Previous Employer', key: 'prev_school_name' },
					{
						label: 'Replacing',
						key: formatNameWithTitle('replace_title', 'replace_first_name', 'replace_last_name')
					},
					{ label: 'Calendar Year', key: 'calendar_year' },
					{ label: 'Jitbit Ticket ID', key: 'ticket_id' }
				]

				if (changeType === 'transferringStaff') {
					// Remove any existing prev_school_name field first
					fieldMap = fieldMap.filter(f => f.key !== 'prev_school_name')
					fieldMap[1].label = 'New School'
					fieldMap.splice(2, 0, { label: 'Original School', key: 'prev_school_name' })
					fieldMap = fieldMap.map(f => {
						if (f.label === 'PS Created') f.label = 'PS Moved'
						if (f.label === 'AD Created') f.label = 'AD Moved'
						if (f.label === 'O365 Created') f.label = 'O365 Moved'
						if (f.label === 'LMS Created') f.label = 'LMS Moved'
						if (f.label === 'Canva Created') f.label = 'Canva Moved'
						return f
					})
				}

				if (changeType === 'jobChange') {
					const schoolIndex = fieldMap.findIndex(f => f.label === 'School')
					if (schoolIndex !== -1) {
						fieldMap.splice(schoolIndex, 0, { label: 'Previous Position', key: 'previous_position' }, { label: 'New Position', key: 'new_position' })
					}
					fieldMap = fieldMap.filter(f => !['O365 Created', 'LMS Created', 'Canva Created', 'Gender', 'DOB', 'Religion', 'Religious Clergy Lay', 'Staff Type', 'Position', 'FTE', 'Previous Employer', 'Replacing'].includes(f.label))
					fieldMap = fieldMap.map(f => {
						if (f.label === 'PS Created') f.label = 'PS Changed'
						if (f.label === 'AD Created') f.label = 'AD Changed'
						return f
					})
				}

				if (changeType === 'subStaff') {
					fieldMap[0].label = $filter('changeTypeFilter')(changeType) + ' Name'
					const schoolIndex = fieldMap.findIndex(f => f.label === 'School')
					if (schoolIndex !== -1) {
						fieldMap.splice(schoolIndex + 1, 0, { label: 'Sub Type', key: 'sub_type' })
					}

					// Move Replacing column to position 1 (after Substitute Name)
					const replacingIndex = fieldMap.findIndex(f => f.label === 'Replacing')
					if (replacingIndex !== -1) {
						const replacingField = fieldMap.splice(replacingIndex, 1)[0]
						fieldMap.splice(1, 0, replacingField)
					}

					fieldMap = fieldMap.filter(f => !['Canva Created', 'Position', 'Previous Employer'].includes(f.label))
				}

				if (changeType === 'nameChange') {
					fieldMap[0].label = "Staff's New Name"
					fieldMap.splice(1, 0, { label: "Staff's Previous Name", key: 'old_name_placeholder' })
					
					// Remove unwanted columns first
					fieldMap = fieldMap.filter(f => !['Gender', 'DOB', 'Religion', 'Religious Clergy Lay', 'Staff Type', 'Position', 'FTE', 'Previous Employer', 'Replacing'].includes(f.label))
					
					// Move Canva Created to before PS Created
					const canvaIndex = fieldMap.findIndex(f => f.label === 'Canva Created')
					const psIndex = fieldMap.findIndex(f => f.label === 'PS Created')
					if (canvaIndex !== -1 && psIndex !== -1 && canvaIndex > psIndex) {
						const canvaField = fieldMap.splice(canvaIndex, 1)[0]
						fieldMap.splice(psIndex, 0, canvaField)
					}
					
					// Update labels
					fieldMap = fieldMap.map(f => {
						if (f.label === 'PS Created') f.label = 'PS Changed'
						if (f.label === 'AD Created') f.label = 'AD Changed'
						if (f.label === 'O365 Created') f.label = 'O365 Changed'
						if (f.label === 'LMS Created') f.label = 'LMS Changed'
						if (f.label === 'Canva Created') f.label = 'Canva Transferred'
						return f
					})
				}

				if (changeType === 'exitingStaff') {
					fieldMap = fieldMap.filter(f => !['O365 Created', 'LMS Created'].includes(f.label))
					fieldMap = fieldMap.map(f => {
						if (f.label === 'PS Created') f.label = 'PS Deactivated'
						if (f.label === 'AD Created') f.label = 'AD Deactivated'
						if (f.label === 'Canva Created') f.label = 'Canva Transferred'
						return f
					})
				}

				if (changeType === 'allStaff') {
					// Override to force specific wording
					fieldMap = fieldMap.map(f => {
						if (f.label === 'Staff Name' || f.label === $filter('changeTypeFilter')(changeType)) {
							f.label = 'Staff Name'
						}
						if (f.label === 'PS Created') f.label = 'PS Created'
						if (f.label === 'AD Created') f.label = 'AD Created'
						if (f.label === 'O365 Created') f.label = 'O365 Created'
						if (f.label === 'LMS Created') f.label = 'LMS Created'
						if (f.label === 'Canva Created') f.label = 'Canva Created'
						return f
					})
					fieldMap.push({
						label: 'Change Type',
						key: row => $filter('changeTypeFilter')(row.change_type) || row.change_type
					})
				}

				const headers = fieldMap.map(f => f.label)
				let csvContent = headers.join(',') + '\r\n'

				data.forEach(row => {
					const csvRow = fieldMap.map(field => {
						let value = typeof field.key === 'function' ? field.key(row) : row[field.key]
						if (typeof value === 'boolean') value = value ? 'TRUE' : 'FALSE'
						if (value instanceof Date) value = value.toISOString().split('T')[0]
						if (typeof value === 'string') value = `"${value.replace(/"/g, '""')}"`
						return value != null ? value : ''
					})
					csvContent += csvRow.join(',') + '\r\n'
				})

				const encodedUri = 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(csvContent)
				const currentDateTime = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0]
				const formattedChangeType = $filter('changeTypeFilter')(changeType) || changeType
				const safeFileName = formattedChangeType.replace(/\s+/g, '_')
				const link = document.createElement('a')
				link.setAttribute('href', encodedUri)
				link.setAttribute('download', `${safeFileName}_${currentDateTime}.csv`)
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
			}
		}
	])
	module.filter('changeTypeFilter', function () {
		const reverseMap = {
			newStaff: 'New Staff',
			transferringStaff: 'Transferring-In Staff',
			jobChange: 'Job Change',
			subStaff: 'Substitute',
			nameChange: 'Name Change',
			exitingStaff: 'Exiting Staff'
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
