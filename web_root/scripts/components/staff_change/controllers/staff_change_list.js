'use strict'
define(function (require) {
	const module = require('components/staff_change/module')

	// The explicit dependency-name array protects AngularJS injection names during minification.
	module.controller('staffChangeListCtrl', [
		'$scope',
		'$attrs',
		'$filter',
		'$q',
		'jsonDataService',
		'formatService',
		function ($scope, $attrs, $filter, $q, jsonDataService, formatService) {
			// Properties on $scope are consumed by the tab directives and PowerSchool grid templates.
			// Double-clicking the page logs that shared scope for troubleshooting on any server.
			$j(document).dblclick(() => console.log($scope))

			// PowerSchool supplies the current school, year, and date as attributes on the Angular application element.
			$scope.staffChangeCounts = []
			$scope.staffList = {}
			$scope.curSchoolId = $attrs.ngCurSchoolId
			$scope.showSchoolColumns = String($scope.curSchoolId) === '0'
			$scope.curYearId = $attrs.ngCurYearId
			$scope.curDate = new Date($attrs.ngCurDate)
			$scope.calendarYear = new Date().getFullYear()
			$scope.selectedTab = document.querySelector('[aria-selected="true"]').getAttribute('data-context')
			$scope.changeType = ''
			$scope.booleanMap = { Yes: true, No: false }
			$scope.titleMap = {}
			$scope.schoolMaps = {
				newStaff: {},
				transferringStaff: {},
				jobChange: {},
				subStaff: {},
				nameChange: {},
				exitingStaff: {},
				allStaff: {}
			}
			$scope.schoolMapReady = {}
			// Start this stable lookup immediately; loadData includes the promise in $q.all before preparing rows.
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
			const schoolAbbreviations = {}
			const loadSchoolAbbreviations = $scope.showSchoolColumns
				? jsonDataService
						.getData('schoolData')
						.then(schoolData => {
							schoolData.forEach(school => {
								if (school.identifier != null && school.abbreviation) {
									schoolAbbreviations[String(school.identifier)] = school.abbreviation
								}
							})
						})
						.catch(() => {})
				: $q.when()

			const getSchoolListDisplay = (schoolId, fallbackName) => {
				if (schoolId != null && schoolAbbreviations[String(schoolId)]) {
					return schoolAbbreviations[String(schoolId)]
				}

				return fallbackName || ''
			}

			const prepareSchoolListDisplay = staffRecord => {
				staffRecord.school_list_display = getSchoolListDisplay(staffRecord.schoolid, staffRecord.schname)
				staffRecord.previous_school_list_display = getSchoolListDisplay(staffRecord.prev_school_number, staffRecord.prev_school_name)
			}
			$scope.changeMap = {
				New: 'newStaff',
				'Transferring-In': 'transferringStaff',
				'Job Change': 'jobChange',
				Substitute: 'subStaff',
				'Name Change': 'nameChange',
				Exiting: 'exitingStaff'
			}

			// Each grid gets only the schools represented by records in its own tab.
			const rebuildSchoolMap = (changeType, staffRecords) => {
				const schools = {}
				const records = Array.isArray(staffRecords) ? staffRecords : []
				const addSchool = (schoolName, schoolCode) => {
					const normalizedName = typeof schoolName === 'string' ? schoolName.trim() : ''
					const normalizedCode = schoolCode == null ? '' : String(schoolCode).trim()
					if (normalizedName && normalizedCode) schools[normalizedName] = normalizedCode
				}

				records.forEach(record => {
					addSchool(record.schname, record.schoolid)
					if (changeType === 'transferringStaff') {
						addSchool(record.prev_school_name, record.prev_school_number)
					}
				})

				const schoolMap = $scope.schoolMaps[changeType]
				Object.keys(schoolMap).forEach(schoolName => delete schoolMap[schoolName])
				Object.keys(schools)
					.sort((leftName, rightName) => leftName.localeCompare(rightName))
					.forEach(schoolName => {
						schoolMap[schoolName] = schools[schoolName]
					})
				$scope.schoolMapReady[changeType] = true
			}
			$scope.subTypeMap = {
				FSTS: 'FSTS',
				LTS: 'LTS'
			}

			const workflowSystems = {
				ps: { label: 'PowerSchool', owner: 'Adrian' },
				ad: { label: 'Active Directory', owner: 'Brad' },
				o365: { label: 'Office 365', owner: 'Brad' },
				ipad: { label: 'iPad/Jamf', owner: 'Greg' },
				lms: { label: 'LMS', owner: 'Shane' },
				canva: { label: 'Canva', owner: 'Carrie' }
			}

			const workflowActionLabels = {
				default: {
					ps: 'PowerSchool Complete',
					ad: 'Active Directory Complete',
					o365: 'Office 365 Complete',
					ipad: 'Jamf User Account Complete',
					lms: 'LMS Complete',
					canva: 'Canva Account Complete'
				},
				newStaff: {
					ps: 'PowerSchool Account Created',
					ad: 'Active Directory Account Created',
					o365: 'Office 365 Account Created',
					ipad: 'Jamf User Account Created',
					lms: 'LMS Account Created',
					canva: 'Canva Account Created'
				},
				transferringStaff: {
					ps: 'PowerSchool Account Moved',
					ad: 'Active Directory Account Moved',
					o365: 'Office 365 Account Verified',
					ipad: 'Jamf User Account Moved',
					lms: 'LMS Account Double Check',
					canva: 'Canva Account Moved'
				},
				jobChange: {
					ps: 'PowerSchool Account Adjusted',
					ad: 'Active Directory Account Adjusted',
					ipad: 'Jamf User Account Created'
				},
				subStaff: {
					ps: 'PowerSchool Account Created',
					ad: 'Active Directory Account Created',
					o365: 'Office 365 Account Created',
					ipad: 'Jamf User Account Created',
					lms: 'LMS Account Created'
				},
				nameChange: {
					canva: 'Canva Account Transferred',
					ps: 'PowerSchool Account Updated',
					ad: 'Active Directory Account Updated',
					o365: 'Office 365 Account Updated',
					ipad: 'Jamf User Account Updated',
					lms: 'LMS Account Updated'
				},
				exitingStaff: {
					canva: 'Canva Account Transferred',
					ps: 'PowerSchool Account Deactivated',
					ad: 'Active Directory Account Disabled',
					ipad: 'Jamf User Account Deleted'
				}
			}

			const getWorkflowActionLabel = (staffRecord, key) => {
				const typeLabels = workflowActionLabels[staffRecord.change_type] || {}
				return typeLabels[key] || workflowActionLabels.default[key] || workflowSystems[key].label
			}

			const getWorkflowStepKeys = (staffRecord, context) => {
				if (context.isFsts) return ['ad', 'o365']

				if (staffRecord.change_type === 'exitingStaff') {
					return ['canva', 'ps', 'ad', 'ipad'].filter(key => key !== 'canva' || context.canvaApplies).filter(key => key !== 'ipad' || context.ipadApplies)
				}

				if (staffRecord.change_type === 'jobChange') {
					return ['ps', 'ad', 'ipad'].filter(key => key !== 'ipad' || context.ipadApplies)
				}

				if (staffRecord.change_type === 'nameChange') {
					return ['canva', 'ps', 'ad', 'o365', 'ipad', 'lms'].filter(key => key !== 'canva' || context.canvaApplies).filter(key => key !== 'ipad' || context.ipadApplies)
				}

				if (staffRecord.change_type === 'subStaff') {
					return ['ps', 'ad', 'o365', 'ipad', 'lms'].filter(key => key !== 'ipad' || context.ipadApplies)
				}

				return ['ps', 'ad', 'o365', 'ipad', 'lms', 'canva'].filter(key => key !== 'ipad' || context.ipadApplies)
			}

			const buildWorkflowProgress = (staffRecord, stepKeys) => {
				const firstPendingIndex = stepKeys.findIndex(key => staffRecord[`${key}_created`] != 1 && staffRecord[`${key}_ignored`] != 1)
				const hasResolvedSteps = stepKeys.some(key => staffRecord[`${key}_created`] == 1 || staffRecord[`${key}_ignored`] == 1)
				const steps = stepKeys.map((key, index) => {
					const system = workflowSystems[key]
					const isComplete = staffRecord[`${key}_created`] == 1
					const isIgnored = !isComplete && staffRecord[`${key}_ignored`] == 1
					const isResolved = isComplete || isIgnored
					const isCurrentPending = !isResolved && hasResolvedSteps && index === firstPendingIndex
					const state = isComplete ? 'complete' : isIgnored ? 'ignored' : isCurrentPending ? 'pending' : 'not-started'
					const status = isComplete ? 'Complete' : isIgnored ? 'Not Applicable' : isCurrentPending ? 'In Progress' : 'Not Started'
					const icon = isResolved ? 'checkmark-alt' : isCurrentPending ? 'inprogress' : 'calendar-custom'
					const classNames = [isResolved ? 'workflow-step-complete' : `workflow-step-${state}`]

					if (isCurrentPending) classNames.push('workflow-step-current')

					return {
						key: key,
						system: system.label,
						owner: system.owner,
						actionLabel: getWorkflowActionLabel(staffRecord, key),
						status: status,
						state: state,
						icon: icon,
						resolved: isResolved,
						className: classNames.join(' '),
						title: `${system.label}: ${status}`
					}
				})
				const completed = steps.filter(step => step.resolved).length
				const total = steps.length
				const pendingSteps = steps.filter(step => !step.resolved)
				const percent = total ? Math.round((completed / total) * 100) : 100
				const status = completed === 0 && pendingSteps.length ? 'Not Started' : pendingSteps.length ? 'In Progress' : 'Complete'
				const statusKey = completed === 0 && pendingSteps.length ? 'not-started' : pendingSteps.length ? 'in-progress' : 'complete'
				const statusIcon = statusKey === 'not-started' ? 'calendar-custom' : statusKey === 'in-progress' ? 'inprogress' : 'checkmark-alt'

				return {
					steps: steps,
					completed: completed,
					total: total,
					remaining: Math.max(total - completed, 0),
					percent: percent,
					status: status,
					statusKey: statusKey,
					statusIcon: statusIcon,
					pendingCount: pendingSteps.length,
					pendingSummary: pendingSteps.length ? `Pending: ${pendingSteps.map(step => step.system).join(', ')}` : 'All workflow checks complete',
					ariaLabel: `${completed} of ${total} workflow checks complete`
				}
			}

			const getDeadlineClass = staffRecord => {
				if (!(staffRecord.completion_date instanceof Date) || staffRecord.completion_date >= $scope.curDate) return ''
				return staffRecord.progress_pending_count > 0 ? 'req-notation' : ''
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

			// Normalize each API row once. Templates then bind simple display properties instead of recalculating them
			// during every Angular digest cycle, including for hidden tabs.
			const prepareStaffRecord = staffRecord => {
				const completionKeys = ['ps', 'ad', 'o365', 'lms', 'canva', 'ipad']

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
				const ipadApplies = staffRecord.ipad_needed == '1' && (staffRecord.change_type !== 'subStaff' || staffRecord.sub_type === 'LTS')
				staffRecord.ipad_applies = ipadApplies
				const workflowStepKeys = getWorkflowStepKeys(staffRecord, {
					isFsts: isFsts,
					excludesOfficeAndLms: excludesOfficeAndLms,
					canvaApplies: canvaApplies,
					ipadApplies: ipadApplies
				})
				const applicableStepKeys = new Set(workflowStepKeys)
				const workflowProgress = buildWorkflowProgress(staffRecord, workflowStepKeys)

				completionKeys.forEach(key => {
					staffRecord[`${key}_filter_complete`] = !applicableStepKeys.has(key) || staffRecord[`${key}_complete`]
				})

				// Store settled display values so hidden, cached tabs do not repeatedly evaluate formatting rules.
				staffRecord.display_name = formatService.formatStaffFullName(staffRecord, { fallbackField: 'old_name_placeholder' })
				staffRecord.change_type_label = $filter('changeTypeFilter')(staffRecord.change_type) || staffRecord.change_type
				staffRecord.change_type_list_label = staffRecord.change_type_label.replace(/\s+Staff\b/g, '')
				staffRecord.change_type_class = changeTypeClasses[staffRecord.change_type] || ''
				staffRecord.sub_type_suffix = staffRecord.change_type === 'subStaff' && staffRecord.sub_type ? ` (${staffRecord.sub_type})` : ''
				staffRecord.completion_display = {
					ps: buildCompletionDisplay(!isFsts, staffRecord.ps_complete),
					ad: buildCompletionDisplay(true, staffRecord.ad_complete),
					o365: buildCompletionDisplay(!excludesOfficeAndLms, staffRecord.o365_complete),
					lms: buildCompletionDisplay(!excludesOfficeAndLms && !isFsts, staffRecord.lms_complete),
					canva: buildCompletionDisplay(canvaApplies, staffRecord.canva_complete),
					ipad: buildCompletionDisplay(ipadApplies, staffRecord.ipad_complete)
				}
				staffRecord.progress_steps = workflowProgress.steps
				staffRecord.progress_completed = workflowProgress.completed
				staffRecord.progress_total = workflowProgress.total
				staffRecord.progress_remaining = workflowProgress.remaining
				staffRecord.progress_percent = workflowProgress.percent
				staffRecord.progress_status = workflowProgress.status
				staffRecord.progress_status_class = `workflow-progress-status-${workflowProgress.statusKey}`
				staffRecord.progress_status_icon = workflowProgress.statusIcon
				staffRecord.progress_button_class = `workflow-progress-${workflowProgress.statusKey}`
				staffRecord.progress_pending_count = workflowProgress.pendingCount
				staffRecord.progress_pending_summary = workflowProgress.pendingSummary
				staffRecord.progress_aria_label = workflowProgress.ariaLabel
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

			const escapeHtml = value =>
				String(value ?? '')
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/"/g, '&quot;')
					.replace(/'/g, '&#39;')

			const renderPdsIcon = iconName => `
				<pds-icon name="${escapeHtml(iconName)}" class="workflow-progress-icon x-scope pds-icon-0 pds-widget" pds-widget="pds-widget">
					<template is="dom-if" class="style-scope pds-icon"></template>
					<svg aria-hidden="true" focusable="false" class="pds-icon-svg style-scope pds-icon"></svg>
				</pds-icon>`

			$scope.openWorkflowProgressDialog = staffRecord => {
				if (!staffRecord) return

				const stepsHtml = (staffRecord.progress_steps || [])
					.map(
						step => `
					<li class="workflow-progress-step ${escapeHtml(step.className)}">
						<div class="workflow-progress-marker">${renderPdsIcon(step.icon)}</div>
						<div class="workflow-progress-detail">
							<div class="workflow-progress-system">${escapeHtml(step.system)}</div>
							<div class="workflow-progress-action">${escapeHtml(step.actionLabel)}</div>
							<div class="workflow-progress-state workflow-progress-state-${escapeHtml(step.state)}">${escapeHtml(step.status)}</div>
						</div>
					</li>`
					)
					.join('')

				psDialog({
					type: 'dialogM',
					width: 1300,
					title: 'Workflow Progress',
					content: `
						<div class="workflow-progress-dialog">
							<div class="workflow-progress-dialog-summary">
								<div>
									<div class="workflow-progress-dialog-name">${escapeHtml(staffRecord.display_name)}</div>
									<div class="workflow-progress-dialog-type ${escapeHtml(staffRecord.change_type_class)}">${escapeHtml(staffRecord.change_type_label)}${escapeHtml(staffRecord.sub_type_suffix)}</div>
								</div>
								<div class="workflow-progress-dialog-count">
									<strong>${escapeHtml(staffRecord.progress_completed)}/${escapeHtml(staffRecord.progress_total)}</strong>
									<span class="${escapeHtml(staffRecord.progress_status_class)}">${escapeHtml(staffRecord.progress_status)}</span>
								</div>
							</div>
							<div class="workflow-progress-stepper-dialog-wrap">
								<ol class="workflow-progress-stepper workflow-progress-stepper-dialog" aria-label="${escapeHtml(staffRecord.progress_aria_label)}">
									${stepsHtml}
								</ol>
							</div>
						</div>`,
					initBehaviors: true,
					buttons: [
						{
							id: 'closeWorkflowProgressDialogButton',
							text: 'Close',
							title: 'Close',
							click: function () {
								psDialogClose()
							}
						}
					]
				})
			}

			// Each tab is loaded once per year/school view. $q.when represents an already-complete load for cached tabs,
			// while $q.all loads counts, titles, and records together for a new tab.
			$scope.loadData = changeType => {
				loadingDialog()
				$scope.changeType = changeType

				const loadPromise = $scope.staffList.hasOwnProperty(changeType)
					? $q.when()
					: $q
							.all({
								titles: loadTitleMap,
								schools: loadSchoolAbbreviations,
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
								$scope.staffList[changeType].forEach(staffRecord => {
									prepareSchoolListDisplay(staffRecord)
									prepareStaffRecord(staffRecord)
								})
							})

				return loadPromise
					.then(() => {
						rebuildSchoolMap(changeType, $scope.staffList[changeType])
						const baseHeaders = ['School', 'Submitted By', 'Submission Date', 'Deadline']
						const changeTypeLabel = $filter('changeTypeFilter')($scope.changeType)

						if ($scope.changeType === 'newStaff') {
							$scope.listHeaders = [changeTypeLabel].concat(baseHeaders, ['Progress', 'Completion Date'])
						} else if ($scope.changeType === 'transferringStaff') {
							$scope.listHeaders = [changeTypeLabel, 'New School', 'Original School'].concat(baseHeaders.slice(1), ['Progress', 'Completion Date'])
						} else if ($scope.changeType === 'jobChange') {
							$scope.listHeaders = ['Staff Name', 'Previous Position/Job', 'New Position/Job'].concat(baseHeaders, ['Progress', 'Completion Date'])
						} else if ($scope.changeType === 'subStaff') {
							$scope.listHeaders = [changeTypeLabel + ' Name', baseHeaders[0], 'Sub Type'].concat(baseHeaders.slice(1), ['Progress', 'Completion Date'])
						} else if ($scope.changeType === 'nameChange') {
							$scope.listHeaders = ["Staff's New Name", "Staff's Previous Name"].concat(baseHeaders, ['Progress', 'Completion Date'])
						} else if ($scope.changeType === 'exitingStaff') {
							$scope.listHeaders = [changeTypeLabel].concat(baseHeaders, ['Progress', 'Completion Date'])
						} else if ($scope.changeType === 'allStaff') {
							$scope.listHeaders = ['Staff Name', 'Change Type'].concat(baseHeaders, ['Progress', 'Completion Date'])
						} else {
							$scope.listHeaders = [changeTypeLabel].concat(baseHeaders, ['Progress', 'Completion Date'])
						}

						$j('#cdol-staff-count').text(`Staff Changes (${$scope.staffChangeCounts.total_remaining})`)
					})
					.finally(closeLoading)
			}

			// Load the tab selected by PowerSchool when the controller first starts.
			$scope.loadData($scope.selectedTab)

			// Reload intentionally clears every tab cache so counts and records are fetched again from the server.
			$scope.reloadData = () => {
				$scope.staffChangeCounts = []
				$scope.staffList = {}
				$scope.selectedTab = document.querySelector('[aria-selected="true"]').getAttribute('data-context')
				$scope.loadData($scope.selectedTab)
			}

			// Export the grid's filtered collection rather than the full tab cache, matching what the user sees onscreen.
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
					{ label: 'iPad Complete', key: row => (row.ipad_applies ? row.ipad_complete : null) },
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
	// These filters translate stored codes into labels used by list templates and exports.
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
