'use strict'
define(function (require) {
	var module = require('components/staff_change/module')

	module.controller('staffChangeListCtrl', [
		'$scope',
		'$attrs',
		'$filter',
		'$q',
		'jsonDataService',
		'formatService',
		function ($scope, $attrs, $filter, $q, jsonDataService, formatService) {
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
			$scope.titleMap = {}
			const loadTitleMap = jsonDataService
				.getData('titleData')
				.then(titleData => {
					titleData.forEach(title => {
						$scope.titleMap[title.code] = title.code
					})
				})
				.catch(() => {
					$scope.titleMap = {}
				})
			$scope.changeMap = {
				'New Staff': 'newStaff',
				'Transferring-In Staff': 'transferringStaff',
				'Job Change': 'jobChange',
				Substitute: 'subStaff',
				'Name Change': 'nameChange',
				'Exiting Staff': 'exitingStaff'
			}

			$scope.schoolMap = {}
			const rebuildSchoolMap = (changeType, staffRecords) => {
				const schoolNames = {}
				const records = Array.isArray(staffRecords) ? staffRecords : []
				const addSchoolName = schoolName => {
					const normalizedName = typeof schoolName === 'string' ? schoolName.trim() : ''
					if (normalizedName) schoolNames[normalizedName] = true
				}

				records.forEach(record => {
					addSchoolName(record.schname)
					if (changeType === 'transferringStaff' && record.prev_school_name) {
						addSchoolName(record.prev_school_name)
					}
				})

				// Preserve the object reference used by PowerSchool's grid while replacing its available values.
				Object.keys($scope.schoolMap).forEach(schoolName => delete $scope.schoolMap[schoolName])
				Object.keys(schoolNames)
					.sort((leftName, rightName) => leftName.localeCompare(rightName))
					.forEach(schoolName => {
						$scope.schoolMap[schoolName] = schoolName
					})
			}
			$scope.subTypeMap = {
				FSTS: 'FSTS',
				LTS: 'LTS'
			}

			const getDeadlineClass = staffRecord => {
				if (staffRecord.completion_date >= $scope.curDate) return ''

				const needsCanva = staffRecord.canva_transfer == '1' && !staffRecord.canva_complete

				if (staffRecord.sub_type === 'FSTS') {
					return !staffRecord.ad_complete || !staffRecord.o365_complete || needsCanva ? 'req-notation' : ''
				}

				if (staffRecord.change_type === 'exitingStaff' || staffRecord.change_type === 'jobChange') {
					return !staffRecord.ps_complete || !staffRecord.ad_complete || needsCanva ? 'req-notation' : ''
				}

				if (staffRecord.change_type === 'newStaff' || staffRecord.change_type === 'transferringStaff') {
					return !staffRecord.ps_complete || !staffRecord.ad_complete || !staffRecord.o365_complete || !staffRecord.lms_complete || !staffRecord.canva_complete ? 'req-notation' : ''
				}

				return !staffRecord.ps_complete || !staffRecord.ad_complete || !staffRecord.o365_complete || !staffRecord.lms_complete || needsCanva ? 'req-notation' : ''
			}

			const buildCompletionDisplay = (isApplicable, isComplete) => {
				if (!isApplicable) {
					return {
						className: 'text-primary fs-6 fw-medium',
						text: '- - -'
					}
				}

				return {
					className: isComplete ? 'mark-complete' : 'mark-incomplete',
					text: ''
				}
			}

			const changeTypeClasses = {
				newStaff: 'text-success',
				transferringStaff: 'text-primary',
				jobChange: 'text-info',
				subStaff: 'text-indigo',
				nameChange: 'text-warning',
				exitingStaff: 'text-secondary'
			}

			const prepareStaffRecord = staffRecord => {
				const completionKeys = ['ps', 'ad', 'o365', 'lms', 'canva']

				completionKeys.forEach(key => {
					staffRecord[`${key}_complete`] = staffRecord[`${key}_created`] == 1 || staffRecord[`${key}_ignored`] == 1
				})

				const isFsts = staffRecord.change_type === 'subStaff' && staffRecord.sub_type === 'FSTS'
				const excludesOfficeAndLms = staffRecord.change_type === 'exitingStaff' || staffRecord.change_type === 'jobChange'

				if (isFsts) {
					staffRecord.ps_complete = true
					staffRecord.lms_complete = true
				}

				if (excludesOfficeAndLms) staffRecord.lms_complete = true
				if (staffRecord.change_type === 'nameChange' && staffRecord.canva_transfer === '0') staffRecord.canva_complete = true

				Object.keys(staffRecord).forEach(key => {
					if (key.endsWith('_date')) {
						staffRecord[key] = staffRecord[key] ? new Date(formatService.formatDateFromApi(staffRecord[key])) : null
					}
				})

				const canvaApplies = staffRecord.change_type === 'newStaff' || staffRecord.change_type === 'transferringStaff' || ((staffRecord.change_type === 'nameChange' || staffRecord.change_type === 'exitingStaff') && staffRecord.canva_transfer == '1')

				// Store settled display values so hidden, cached tabs do not repeatedly evaluate formatting rules.
				staffRecord.display_name = formatService.formatStaffFullName(staffRecord, { fallbackField: 'old_name_placeholder' })
				staffRecord.change_type_label = $filter('changeTypeFilter')(staffRecord.change_type) || staffRecord.change_type
				staffRecord.change_type_class = changeTypeClasses[staffRecord.change_type] || ''
				staffRecord.sub_type_suffix = staffRecord.change_type === 'subStaff' && staffRecord.sub_type ? ` (${staffRecord.sub_type})` : ''
				staffRecord.completion_display = {
					ps: buildCompletionDisplay(!isFsts, staffRecord.ps_complete),
					ad: buildCompletionDisplay(true, staffRecord.ad_complete),
					o365: buildCompletionDisplay(!excludesOfficeAndLms, staffRecord.o365_complete),
					lms: buildCompletionDisplay(!excludesOfficeAndLms && !isFsts, staffRecord.lms_complete),
					canva: buildCompletionDisplay(canvaApplies, staffRecord.canva_complete)
				}
				staffRecord.deadline_class = getDeadlineClass(staffRecord)
				staffRecord.completed = !!staffRecord.final_completion_date

				if (staffRecord.submission_time) {
					const timeParts = staffRecord.submission_time.split(' ')
					const clockParts = timeParts[0].split(':')
					const period = timeParts[1]
					let hours24 = parseInt(clockParts[0], 10)

					if (period === 'PM' && hours24 !== 12) hours24 += 12
					else if (period === 'AM' && hours24 === 12) hours24 = 0

					const submissionDate = new Date()
					submissionDate.setHours(hours24)
					submissionDate.setMinutes(parseInt(clockParts[1], 10))
					submissionDate.setSeconds(0)
					staffRecord.sort_time = submissionDate
				}
			}

			$scope.loadData = changeType => {
				loadingDialog()
				$scope.changeType = changeType

				const loadPromise = $scope.staffList.hasOwnProperty(changeType)
					? $q.when()
					: $q
							.all({
								titles: loadTitleMap,
								counts: jsonDataService.getData('staffChangeCountData', {
									curSchoolID: $scope.curSchoolId,
									calendarYear: $scope.calendarYear
								}),
								staff: jsonDataService.getData('staffChangeData', {
									curSchoolID: $scope.curSchoolId,
									calendarYear: $scope.calendarYear,
									changeType: changeType
								})
							})
							.then(preload => {
								$scope.staffChangeCounts = preload.counts[0] || {}
								const staffResults = preload.staff

								if (!staffResults.length) {
									$scope.staffList[changeType] = {}
									return
								}

								$scope.staffList[changeType] = staffResults
								$scope.staffList[changeType].forEach(prepareStaffRecord)
							})

				return loadPromise
					.then(() => {
						rebuildSchoolMap(changeType, $scope.staffList[changeType])
						const baseHeaders = ['School', 'Submitted By', 'Submission Date', 'Deadline']
						const changeTypeLabel = $filter('changeTypeFilter')($scope.changeType)

						if ($scope.changeType === 'newStaff') {
							$scope.listHeaders = [changeTypeLabel].concat(baseHeaders, ['PS Created', 'AD Created', 'O365 Created', 'LMS Created', 'Canva Created', 'Completion Date'])
						} else if ($scope.changeType === 'transferringStaff') {
							$scope.listHeaders = [changeTypeLabel, 'New School', 'Original School'].concat(baseHeaders.slice(1), ['PS Moved', 'AD Moved', 'O365 Moved', 'LMS Moved', 'Canva Moved', 'Completion Date'])
						} else if ($scope.changeType === 'jobChange') {
							$scope.listHeaders = ['Staff Name', 'Previous Position/Job', 'New Position/Job'].concat(baseHeaders, ['PS Changed', 'AD Changed', 'Completion Date'])
						} else if ($scope.changeType === 'subStaff') {
							$scope.listHeaders = [changeTypeLabel + ' Name', baseHeaders[0], 'Sub Type'].concat(baseHeaders.slice(1), ['PS Created', 'AD Created', 'O365 Created', 'LMS Created', 'Completion Date'])
						} else if ($scope.changeType === 'nameChange') {
							$scope.listHeaders = ["Staff's New Name", "Staff's Previous Name"].concat(baseHeaders, ['Canva Transferred', 'PS Changed', 'AD Changed', 'O365 Changed', 'LMS Changed', 'Completion Date'])
						} else if ($scope.changeType === 'exitingStaff') {
							$scope.listHeaders = [changeTypeLabel].concat(baseHeaders, ['Canva Transferred', 'PS Deactivated', 'AD Deactivated', 'Completion Date'])
						} else if ($scope.changeType === 'allStaff') {
							$scope.listHeaders = ['Staff Name', 'Change Type'].concat(baseHeaders, ['PS Complete', 'AD Complete', 'O365 Complete', 'LMS Complete', 'Canva Complete', 'Completion Date'])
						} else {
							$scope.listHeaders = [changeTypeLabel].concat(baseHeaders, ['PS Created', 'AD Created', 'O365 Created', 'LMS Created', 'Canva Created', 'Completion Date'])
						}

						$j('#cdol-staff-count').text(`Staff Changes (${$scope.staffChangeCounts.total_remaining})`)
					})
					.finally(closeLoading)
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

			$scope.exportGridData = () => {
				const changeType = $scope.changeType
				const listName = `filtered${changeType.charAt(0).toUpperCase()}${changeType.slice(1)}List`
				const data = $scope[listName]

				if (!Array.isArray(data) || data.length === 0) {
					alert('No data to export.')
					return
				}

				let fieldMap = [
					{
						label: changeType === 'allStaff' ? 'Staff Name' : $filter('changeTypeFilter')(changeType),
						key: row => formatService.formatStaffFullName(row, { fallbackField: 'old_name_placeholder' })
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
						key: row => formatService.formatStaffFullName(row, { prefix: 'replace_' })
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
					fieldMap = fieldMap.filter(f => !['O365 Created', 'LMS Created', 'Microsoft License', 'Gender', 'DOB', 'Religion', 'Religious Clergy Lay', 'Staff Type', 'Position', 'FTE', 'Previous Employer', 'Replacing'].includes(f.label))

					// Move Canva Created to before PS Created
					const canvaIndex = fieldMap.findIndex(f => f.label === 'Canva Created')
					const psIndex = fieldMap.findIndex(f => f.label === 'PS Created')
					if (canvaIndex !== -1 && psIndex !== -1 && canvaIndex > psIndex) {
						const canvaField = fieldMap.splice(canvaIndex, 1)[0]
						fieldMap.splice(psIndex, 0, canvaField)
					}

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
						if (f.label === 'PS Created') f.label = 'PS Complete'
						if (f.label === 'AD Created') f.label = 'AD Complete'
						if (f.label === 'O365 Created') f.label = 'O365 Complete'
						if (f.label === 'LMS Created') f.label = 'LMS Complete'
						if (f.label === 'Canva Created') f.label = 'Canva Complete'
						return f
					})

					// Insert Change Type column after Staff Name (position 1)
					fieldMap.splice(1, 0, {
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
			exitingStaff: 'Exiting Staff',
			allStaff: 'All Staff'
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
