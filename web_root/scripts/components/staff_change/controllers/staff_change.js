'use strict'
define(function (require) {
	const angular = require('angular')
	const module = require('components/staff_change/module')

	// The string array keeps AngularJS dependency injection working if this file is minified.
	module.controller('staffChangeCtrl', [
		'$scope',
		'$attrs',
		'$window',
		'$anchorScroll',
		'$location',
		'$q',
		'jsonDataService',
		'formatService',
		'psApiService',
		'jitbitService',
		function ($scope, $attrs, $window, $anchorScroll, $location, $q, jsonDataService, formatService, psApiService, jitbitService) {
			// Values placed on $scope are available to the HTML templates; local helpers remain private to this controller.
			// Double-clicking the page exposes the current scope in the console for PowerSchool troubleshooting.
			$j(document).dblclick(() => console.log($scope))

			$scope.refreshPage = function () {
				$window.location.reload()
			}

			// Wait until Angular has rendered the next form before moving the viewport to its top.
			const scrollToFormTop = () => {
				$window.requestAnimationFrame(() => {
					const scrollTarget = $window.document.getElementById('staff-change-scroll-top')
					if (scrollTarget) scrollTarget.scrollIntoView({ block: 'start' })
					else $window.scrollTo(0, 0)
				})
			}

			let psDialogHolder = null

			// PowerSchool dialogs move existing DOM nodes, so detach the Angular view and return it when the dialog closes.
			$scope.openDialog = function (type) {
				psDialogHolder = $j(`#${type}Div`).detach()
				let dialogMessage
				let dialogButtons = []

				if (type === 'staffDupe') {
					dialogMessage = 'Potential Staff Found!'
					dialogButtons = [
						{
							id: 'saveDialogButton',
							text: 'Proceed',
							title: 'Proceed',
							click: function () {
								psDialogClose()
							}
						}
					]
				} else if (type === 'staffChangeDupe') {
					dialogMessage = 'Potential Duplicate Staff Change Found!'
					dialogButtons = [
						{
							id: 'saveDialogButton',
							text: 'Proceed',
							title: 'Proceed',
							click: function () {
								psDialogClose()
							}
						}
					]
				} else if (type === 'sub') {
					dialogMessage = 'No Staff Submission Needed for STS'
					dialogButtons = [
						{
							id: 'exitDialogButton',
							text: 'Exit',
							title: 'Exit',
							click: function () {
								psDialogClose()
								// Redirect to list.html
								$scope.toListRedirect('subStaff')
							}
						}
					]
				} else if (type === 'subChange') {
					dialogMessage = 'Convert to Substitute Staff?'
					dialogButtons = [
						{
							id: 'exitDialogButton',
							text: 'Exit',
							title: 'Exit',
							click: function () {
								psDialogClose()
								// Redirect to list.html
								$scope.toListRedirect('subStaff')
							}
						}
					]
				}

				psDialog({
					type: 'dialogM',
					width: 1000,
					title: dialogMessage,
					content: psDialogHolder,
					initBehaviors: true,
					close: function () {
						// Move View back to a holder so that it won't be lost if another type of dialog is opened.
						$j(`#${type}DialogContainer`).append(psDialogHolder)
					},
					buttons: dialogButtons
				})
			}

			$scope.closeDialog = function (formType, pageContext, type) {
				$j(`#${type}DialogContainer`).append(psDialogHolder)
				psDialogClose()
				if (pageContext === 'exitingStaff') {
					$location.hash('leaving_radio_target')
					delete $scope.submitPayload.exitingStaff
					$scope.submitPayload[formType].leaving_radio = 0
					$anchorScroll()
				}
				if (pageContext === 'jobChange') {
					$location.hash('position_radio_target')
					delete $scope.submitPayload.jobChange
					$scope.submitPayload[formType].position_radio = 0
					$anchorScroll()
				}
			}

			// PowerSchool renders these ng-* attributes on the page before Angular starts the controller.
			// userContext is shared by all form directives and describes both the session and current workflow step.
			// Test servers use names like PSTEST2, not only DNS names containing ".test.".
			const isTestServerName = serverName => (serverName || '').toLowerCase().indexOf('test') !== -1
			const isTestServer = isTestServerName($attrs.ngServerName)
			$scope.userContext = {
				pageStatus: $attrs.ngStatus,
				curSchoolId: $attrs.ngCurSchoolId,
				curSchoolName: $attrs.ngCurSchoolName,
				curYearId: $attrs.ngCurYearId,
				curDate: $attrs.ngCurDate,
				curTime: $attrs.ngCurTime,
				staffChangeId: $attrs.ngStaffChangeId,
				curUserDcid: $attrs.ngCurUserDcid,
				curUserName: $attrs.ngCurUserName,
				curUserEmail: $attrs.ngCurUserEmail,
				curUserSchoolAbbr: $attrs.ngCurUserSchoolAbbr,
				curUserSecurityRoles: $attrs.ngCurUserSecurityRoles,
				districtUser: $attrs.ngCurUserSecurityRoles && $attrs.ngCurUserSecurityRoles.split(',').includes('9'),
				pageContext: 'start',
				prevContext: undefined,
				serverName: $attrs.ngServerName,
				isTestServer: isTestServer,
				sendJitbit: !isTestServer
			}

			// The test-server checkbox lets a tester explicitly enable or suppress Jitbit integration.
			$scope.toggleJitbitCheckbox = () => {
				$scope.userContext.serverName = $scope.userContext.sendJitbit ? undefined : $attrs.ngServerName
			}

			// Deadline validation is kept here because each form shares the same business-day rules and UI state.
			const curYear = new Date().getFullYear()
			const firstDay = new Date(`01/01/${curYear}`)
			const lastDay = new Date(`06/30/${curYear}`)
			const today = new Date()
			today.setHours(0, 0, 0, 0)

			$scope.holidays = [
				new Date(`01/01/${curYear}`), // New Year's Day
				new Date(`01/02/${curYear}`), // Christmas Break
				new Date(`01/03/${curYear}`), // Christmas Break
				new Date(`01/04/${curYear}`), // Christmas Break
				new Date(`01/19/${curYear}`), // MLK Jr. Day
				new Date(`04/02/${curYear}`), // Holy Thursday
				new Date(`04/03/${curYear}`), // Good Friday
				new Date(`04/04/${curYear}`), // Saturday
				new Date(`04/05/${curYear}`), // Easter
				new Date(`04/06/${curYear}`), // Easter Monday
				new Date(`04/07/${curYear}`), // Easter Tuesday
				new Date(`05/25/${curYear}`), // Memorial Day
				new Date(`05/14/${curYear}`), // Ascension Day
				new Date(`07/01/${curYear}`), // PowerSchool Roll Over
				new Date(`07/03/${curYear}`), // Independence Day
				new Date(`09/07/${curYear}`), // Labor Day
				new Date(`11/02/${curYear}`), // All Saints' Day
				new Date(`11/25/${curYear}`), // Thanksgiving Break
				new Date(`11/26/${curYear}`), // Thanksgiving Break
				new Date(`11/27/${curYear}`), // Thanksgiving Break
				new Date(`12/08/${curYear}`), // Immaculate Conception
				new Date(`12/23/${curYear}`), // Christmas Break
				new Date(`12/24/${curYear}`), // Christmas Break
				new Date(`12/25/${curYear}`), // Christmas Break
				new Date(`12/26/${curYear}`), // Christmas Break
				new Date(`12/27/${curYear}`), // Christmas Break
				new Date(`12/28/${curYear}`), // Christmas Break
				new Date(`12/29/${curYear}`), // Christmas Break
				new Date(`12/30/${curYear}`), // Christmas Break
				new Date(`12/31/${curYear}`) // Christmas Break
			]

			const formatDate = date => {
				const month = ('0' + (date.getMonth() + 1)).slice(-2)
				const day = ('0' + date.getDate()).slice(-2)
				const year = date.getFullYear()
				return `${month}/${day}/${year}`
			}

			const parseDate = dateString => {
				if (!dateString) return null

				const dateParts = dateString.split('/')
				if (dateParts.length !== 3) return null

				const month = Number(dateParts[0])
				const day = Number(dateParts[1])
				const year = Number(dateParts[2])
				const date = new Date(year, month - 1, day)

				if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null

				date.setHours(0, 0, 0, 0)
				return date
			}

			const isBusinessDay = date => {
				if (!date || date.getDay() === 0 || date.getDay() === 6) return false
				return !$scope.holidays.some(holiday => holiday.getTime() === date.getTime())
			}

			const addBusinessDays = (startDate, days) => {
				let date = new Date(startDate)
				while (days > 0) {
					date.setDate(date.getDate() + 1)
					// Check if it's a weekend
					if (date.getDay() === 0 || date.getDay() === 6) {
						continue
					}
					// Check if it's a holiday
					if ($scope.holidays.some(holiday => holiday.getTime() === date.getTime())) {
						continue
					}
					days--
				}
				return date
			}

			$scope.userContext.minDate = formatDate(addBusinessDays(today, 3))
			$scope.userContext.today = formatDate(today)
			$scope.userContext.lastDay = formatDate(lastDay)
			$scope.userContext.emergencyRequests = {}

			if (today >= firstDay && today < lastDay) {
				$scope.userContext.tempDeadline = $scope.userContext.lastDay
			} else {
				$scope.userContext.tempDeadline = $scope.userContext.minDate
			}

			// Emergency overrides are tracked per form so switching between form directives does not mix their reasons.
			const getEmergencyRequest = pageContext => $scope.userContext.emergencyRequests[pageContext]
			const emergencyOverrideLabels = {
				exitingStaff: 'Emergency Deactivation Date Override',
				nameChange: 'Emergency Change Date Override',
				subStaff: 'Emergency Creation Date Override',
				jobChange: 'Emergency Change Date Override',
				transferringStaff: 'Emergency Account Transfer Date Override',
				newStaff: 'Emergency Creation Date Override'
			}
			const getEmergencyOverrideLabel = pageContext => emergencyOverrideLabels[pageContext] || 'Emergency Date Override'
			const getEmergencyNote = (pageContext, reason) => `${getEmergencyOverrideLabel(pageContext)}: ${reason}`

			const removeEmergencyReasonFromNotes = (pageContext, emergencyRequest = getEmergencyRequest(pageContext)) => {
				const formPayload = $scope.submitPayload[pageContext]
				if (!formPayload || !emergencyRequest) return

				const emergencyNote = getEmergencyNote(pageContext, emergencyRequest.reason)
				const notes = (formPayload.notes || '').trim()

				if (notes === emergencyNote) {
					formPayload.notes = ''
				} else if (notes.endsWith(`\n\n${emergencyNote}`)) {
					formPayload.notes = notes.slice(0, -`\n\n${emergencyNote}`.length).trim()
				}
			}

			const appendEmergencyReasonToNotes = (formPayload, pageContext) => {
				const emergencyRequest = getEmergencyRequest(pageContext)
				if (!emergencyRequest) return

				const emergencyNote = getEmergencyNote(pageContext, emergencyRequest.reason)
				const notes = (formPayload.notes || '').trim()
				if (notes.endsWith(emergencyNote)) return

				formPayload.notes = notes ? `${notes}\n\n${emergencyNote}` : emergencyNote
			}

			const updateDeadlinePickerMinimum = (pageContext, minimumDate) => {
				const deadlinePicker = $j(`#${pageContext}-deadline`)
				if (!deadlinePicker.length) return

				deadlinePicker.attr('data-minDate', minimumDate)
				try {
					if (typeof deadlinePicker.datepicker === 'function') {
						deadlinePicker.datepicker('option', 'minDate', parseDate(minimumDate))
					}
				} catch (error) {
					console.warn('Unable to update the deadline picker minimum date.', error)
				}
			}

			const clearEmergencyRequest = pageContext => {
				removeEmergencyReasonFromNotes(pageContext)
				delete $scope.userContext.emergencyRequests[pageContext]
				updateDeadlinePickerMinimum(pageContext, $scope.userContext.minDate)
			}

			$scope.getDeadlineMinDate = pageContext => (getEmergencyRequest(pageContext) ? $scope.userContext.today : $scope.userContext.minDate)

			$scope.isEmergencyRequestEnabled = pageContext => !!getEmergencyRequest(pageContext)

			$scope.checkIfBusinessDay = pageContext => {
				const formPayload = $scope.submitPayload[pageContext]
				const checkDate = parseDate(formPayload && formPayload.deadline)
				const minimumDate = parseDate($scope.userContext.minDate)
				const emergencyRequest = getEmergencyRequest(pageContext)

				$scope.userContext.invalidDateMessage = ''

				if (!checkDate) {
					$scope.userContext.invalidDate = true
					$scope.userContext.invalidDateMessage = 'Please enter a valid date.'
					return false
				}

				if ($scope.userContext.pageStatus !== 'Submit') {
					$scope.userContext.invalidDate = !isBusinessDay(checkDate)
					$scope.userContext.invalidDateMessage = $scope.userContext.invalidDate ? `${formPayload.deadline} is not a Business Day. Please choose another date.` : ''
					return !$scope.userContext.invalidDate
				}

				if (checkDate < today) {
					$scope.userContext.invalidDate = true
					$scope.userContext.invalidDateMessage = 'Past dates are not allowed.'
					return false
				}

				if (emergencyRequest && checkDate >= minimumDate) {
					clearEmergencyRequest(pageContext)
				}

				if (checkDate < minimumDate && !getEmergencyRequest(pageContext)) {
					$scope.userContext.invalidDate = true
					$scope.userContext.invalidDateMessage = 'Deadlines sooner than three business days require an Emergency override.'
					return false
				}

				const isToday = checkDate.getTime() === today.getTime()
				$scope.userContext.invalidDate = !isToday && !isBusinessDay(checkDate)
				$scope.userContext.invalidDateMessage = $scope.userContext.invalidDate ? `${formPayload.deadline} is not a Business Day. Please choose another date.` : ''
				return !$scope.userContext.invalidDate
			}

			$scope.openEmergencyRequest = pageContext => {
				if ($scope.userContext.pageStatus !== 'Submit') return

				const existingRequest = getEmergencyRequest(pageContext)
				const emergencyOverrideLabel = getEmergencyOverrideLabel(pageContext)
				const dialogContent = `
					<div class="p-2">
						<p><strong>Use this override only when immediate action is needed, such as an immediate staff termination, a new staff member starting today, a security concern, or another urgent situation.</strong></p>
						<p>This high priority request does not guarantee same-day completion, but our staff will do their best to complete it as soon as possible.</p>
						<div class="form-floating">
							<textarea id="emergencyRequestReason" class="form-control staff-change-emergency-reason" maxlength="250" spellcheck="true" wrap="soft" placeholder="${emergencyOverrideLabel}"></textarea>
							<label for="emergencyRequestReason" class="fw-semibold">Reason for ${emergencyOverrideLabel}</label>
						</div>
						<div id="emergencyRequestReasonError" class="text-danger mt-1 hide">Please enter a reason for the ${emergencyOverrideLabel}.</div>
					</div>`

				psDialog({
					type: 'dialogM',
					width: 600,
					title: emergencyOverrideLabel,
					content: dialogContent,
					initBehaviors: true,
					buttons: [
						{
							id: 'cancelEmergencyRequestButton',
							text: 'Cancel',
							title: 'Cancel',
							click: function () {
								psDialogClose()
							}
						},
						{
							id: 'enableEmergencyRequestButton',
							text: 'Enable emergency override',
							title: 'Enable emergency override',
							click: function () {
								const reason = ($j('#emergencyRequestReason').val() || '').trim()
								if (!reason) {
									$j('#emergencyRequestReasonError').removeClass('hide')
									$j('#emergencyRequestReason').trigger('focus')
									return
								}

								$scope.$applyAsync(() => {
									removeEmergencyReasonFromNotes(pageContext, existingRequest)
									$scope.userContext.emergencyRequests[pageContext] = { reason: reason }
									appendEmergencyReasonToNotes($scope.submitPayload[pageContext], pageContext)
									$scope.submitPayload[pageContext].deadline = $scope.userContext.today
									$scope.checkIfBusinessDay(pageContext)
									updateDeadlinePickerMinimum(pageContext, $scope.userContext.today)
								})
								psDialogClose()
							}
						}
					]
				})

				if (existingRequest) {
					$j('#emergencyRequestReason').val(existingRequest.reason)
				}
				$j('#emergencyRequestReason').trigger('focus')
			}

			$scope.isOtherSchool = schoolId => [130, 131, 160, 189, 210, 211, 264, 437].includes(Number(schoolId))

			$scope.getAdditionalSchoolId = (schoolId, pageContext) => {
				if (!schoolId || schoolId == 0) {
					// Ensure additional_schoolid is not null or undefined
					return $scope.submitPayload[pageContext] && $scope.submitPayload[pageContext].additional_schoolid ? $scope.submitPayload[pageContext].additional_schoolid : ''
				}

				const pairs = {
					130: 131,
					131: 130,
					160: 264,
					264: 160,
					189: 437,
					437: 189,
					210: 211,
					211: 210
				}
				return pairs[schoolId] || null
			}

			// submitPayload is keyed by change type because one submission can create related records, such as a replacement exit.
			// The option arrays are separate from the payload so broad lookup rows never become API fields accidentally.
			$scope.submitPayload = {}
			$scope.originalStaffChangePayloads = {}
			$scope.originalJitbitSnapshots = {}
			$scope.originalChangeType = undefined
			$scope.titleData = []
			$scope.primaryUserOptions = []
			$scope.relatedUserOptions = []
			$scope.schoolOptions = []
			$scope.lookupLoading = {
				primaryUsers: false,
				relatedUsers: false,
				schools: false
			}

			const sameIdentifier = (leftValue, rightValue) => {
				return leftValue !== undefined && leftValue !== null && rightValue !== undefined && rightValue !== null && leftValue.toString() === rightValue.toString()
			}

			const isLongTermSubstitute = staffChange => {
				return staffChange && staffChange.change_type === 'subStaff' && staffChange.sub_type === 'LTS'
			}

			const getAccountCheckOrder = (pageContext, staffChange) => {
				const needsIpad = staffChange.ipad_needed == '1'
				const needsCanva = staffChange.canva_transfer == '1'

				switch (pageContext) {
					case 'newStaff':
					case 'transferringStaff':
						return ['ps', 'ad', 'o365'].concat(needsIpad ? ['ipad'] : [], ['lms', 'canva'])
					case 'jobChange':
						return ['ps', 'ad'].concat(needsIpad ? ['ipad'] : [])
					case 'subStaff':
						return staffChange.sub_type === 'LTS' ? ['ps', 'ad', 'o365'].concat(needsIpad ? ['ipad'] : [], ['lms']) : ['ad', 'o365']
					case 'nameChange':
						return (needsCanva ? ['canva'] : []).concat(['ps', 'ad', 'o365'], needsIpad ? ['ipad'] : [], ['lms'])
					case 'exitingStaff':
						return (needsCanva ? ['canva'] : []).concat(['ps', 'ad'], needsIpad ? ['ipad'] : [])
					default:
						return []
				}
			}

			$scope.getAccountCheckPrimaryClass = cardKey => {
				const pageContext = $scope.userContext.pageContext
				const staffChange = $scope.submitPayload[pageContext] || {}
				const cardIndex = getAccountCheckOrder(pageContext, staffChange).indexOf(cardKey)

				return cardIndex % 2 === 0 ? 'account-check-primary-blue' : 'account-check-primary-cool-blue'
			}

			const normalizeIdentifier = identifier => {
				if (identifier === undefined || identifier === null || identifier === '') return identifier
				return identifier.toString()
			}

			const buildUserOptions = (records, markInactive) => {
				const options = (records || []).map(record => {
					const option = angular.copy(record)
					const inactiveMarker = markInactive && option.staff_status != 1 ? ' *' : ''

					option.identifier = normalizeIdentifier(option.identifier)
					option.optionLabel = `${option.first_name || ''} ${option.last_name || ''}`.trim() + inactiveMarker
					return option
				})

				return options
			}

			const buildSchoolOptions = records => {
				const options = (records || []).map(record => {
					const option = angular.copy(record)
					option.identifier = normalizeIdentifier(option.identifier)
					return option
				})

				options.push({ identifier: '0', schoolname: 'Diocesan Office' })
				return options
			}

			const normalizePayloadLookupIdentifiers = staffChange => {
				if (!staffChange) return

				// PowerSchool's schema API expects integer field values as strings, matching native select behavior.
				const lookupFieldNames = ['users_dcid', 'replace_dcid', 'canva_dcid', 'prev_school_number']
				lookupFieldNames.forEach(fieldName => {
					if (staffChange[fieldName] !== undefined && staffChange[fieldName] !== null && staffChange[fieldName] !== '') {
						staffChange[fieldName] = normalizeIdentifier(staffChange[fieldName])
					}
				})
			}

			// Load only the lookups required by the active form. $q.all returns one promise that resolves after every
			// requested lookup finishes, allowing the form directive to wait before displaying edit-time selections.
			$scope.loadFormLookups = pageContext => {
				const needsPrimaryUsers = ['transferringStaff', 'jobChange', 'nameChange', 'exitingStaff'].includes(pageContext)
				const needsRelatedUsers = ['newStaff', 'transferringStaff', 'subStaff', 'exitingStaff'].includes(pageContext)
				const needsSchools = ['newStaff', 'transferringStaff', 'subStaff'].includes(pageContext)
				const preload = {}

				if (needsPrimaryUsers && pageContext === 'transferringStaff') {
					$scope.lookupLoading.primaryUsers = true
					preload.primaryUsers = jsonDataService
						.getData('userData', {
							curSchoolID: '0',
							staffStatus: '1,2'
						})
						.then(
							records => {
								$scope.primaryUserOptions = buildUserOptions(records, true)
							},
							() => {
								$scope.primaryUserOptions = buildUserOptions([], true)
							}
						)
						.finally(() => {
							$scope.lookupLoading.primaryUsers = false
						})
				}

				if ((needsPrimaryUsers && pageContext !== 'transferringStaff') || needsRelatedUsers) {
					if (needsPrimaryUsers && pageContext !== 'transferringStaff') $scope.lookupLoading.primaryUsers = true
					if (needsRelatedUsers) $scope.lookupLoading.relatedUsers = true

					preload.activeUsers = jsonDataService
						.getData('userData', {
							curSchoolID: $scope.userContext.curSchoolId,
							staffStatus: '1'
						})
						.then(
							records => {
								if (needsPrimaryUsers && pageContext !== 'transferringStaff') {
									$scope.primaryUserOptions = buildUserOptions(records, false)
								}
								if (needsRelatedUsers) $scope.relatedUserOptions = buildUserOptions(records, false)
							},
							() => {
								if (needsPrimaryUsers && pageContext !== 'transferringStaff') {
									$scope.primaryUserOptions = buildUserOptions([], false)
								}
								if (needsRelatedUsers) $scope.relatedUserOptions = buildUserOptions([], false)
							}
						)
						.finally(() => {
							if (needsPrimaryUsers && pageContext !== 'transferringStaff') $scope.lookupLoading.primaryUsers = false
							if (needsRelatedUsers) $scope.lookupLoading.relatedUsers = false
						})
				}

				if (needsSchools) {
					$scope.lookupLoading.schools = true
					preload.schools = jsonDataService
						.getData('schoolData')
						.then(
							records => {
								$scope.schoolData = records
								$scope.schoolOptions = buildSchoolOptions(records)
							},
							() => {
								$scope.schoolOptions = buildSchoolOptions([])
							}
						)
						.finally(() => {
							$scope.lookupLoading.schools = false
						})
				}

				return $q.all(preload)
			}

			const findSchoolNameByNumber = schoolNumber => {
				if (schoolNumber === undefined || schoolNumber === null || schoolNumber === '') return ''
				if (schoolNumber.toString() === '0') return 'Diocesan Office'
				if (schoolNumber.toString() === '-1') return ''

				const foundSchool = $scope.schoolData && $scope.schoolData.find(school => sameIdentifier(school.identifier, schoolNumber))
				return foundSchool ? foundSchool.schoolname : ''
			}

			const fillPreviousSchoolNameFromSchoolData = staffChange => {
				if (!staffChange || staffChange.prev_school_name || !staffChange.prev_school_number) return

				const previousSchoolName = findSchoolNameByNumber(staffChange.prev_school_number)
				if (previousSchoolName) staffChange.prev_school_name = previousSchoolName
			}

			// Lookup endpoints intentionally return extra fields. These mappers copy only values owned by the form payload.
			const copyMappedFields = (target, source, fieldMap) => {
				if (!target || !source) return target

				Object.keys(fieldMap).forEach(sourceField => {
					if (source[sourceField] !== undefined) {
						target[fieldMap[sourceField]] = source[sourceField]
					}
				})

				return target
			}

			const copyPrimaryStaffFromUser = (target, userRecord) => {
				copyMappedFields(target, userRecord, {
					identifier: 'users_dcid',
					title: 'title',
					first_name: 'first_name',
					last_name: 'last_name',
					gender: 'gender',
					license_microsoft: 'license_microsoft',
					staff_status: 'staff_status'
				})
				return target
			}

			const copyPreviousSchoolFromUser = (target, userRecord) => {
				copyMappedFields(target, userRecord, {
					homeschoolid: 'prev_school_number',
					homeschoolname: 'prev_school_name'
				})
				return target
			}

			const copyPrefixedStaffFromUser = (target, userRecord, prefix, options = {}) => {
				if (!target || !userRecord) return target

				const prefixedFieldMap = {
					identifier: `${prefix}dcid`,
					title: `${prefix}title`,
					first_name: `${prefix}first_name`,
					last_name: `${prefix}last_name`,
					homeschoolid: `${prefix}homeschoolid`,
					homeschoolname: `${prefix}homeschoolname`,
					staff_status: `${prefix}staff_status`
				}
				if (!options.skipLicenseMicrosoft) {
					prefixedFieldMap.license_microsoft = `${prefix}license_microsoft`
				}

				copyMappedFields(target, userRecord, prefixedFieldMap)
				return target
			}

			const copyTransferringStaffFromDuplicate = (target, duplicateRecord) => {
				if (!target || !duplicateRecord) return target

				copyMappedFields(target, duplicateRecord, {
					identifier: 'users_dcid',
					title: 'title',
					first_name: 'first_name',
					last_name: 'last_name',
					license_microsoft: 'license_microsoft',
					prev_school_number: 'prev_school_number',
					prev_school_name: 'prev_school_name'
				})
				return target
			}

			const removeLookupOnlyFields = (target, prefix) => {
				if (!target) return

				const baseLookupOnlyFields = ['identifier', 'email_addr', 'homeschoolid', 'homeschoolname', 'ssdcid', 'status', 'schoolstaff_dcid']
				const prefixedLookupOnlyFields = ['identifier', 'email_addr', 'ssdcid', 'status', 'schoolstaff_dcid']
				const fieldNames = prefix ? prefixedLookupOnlyFields : baseLookupOnlyFields

				// Lookup data can be broad for future use, but the form payload should keep only intentional fields.
				fieldNames.forEach(fieldName => {
					delete target[`${prefix || ''}${fieldName}`]
				})
			}

			const setSubstituteSchoolStaffRecordData = staffRecord => {
				if (!staffRecord || !staffRecord.ssdcid) return

				// Keep the Open Staff Record button ready as soon as an existing PS staff record is selected.
				$scope.substituteSchoolStaffRecordData = [
					{
						ssdcid: staffRecord.ssdcid,
						schoolid: staffRecord.prev_school_number || staffRecord.homeschoolid || staffRecord.schoolid || ''
					}
				]
			}

			const hydrateSubstituteFromStaffRecord = staffRecord => {
				if (!staffRecord || !$scope.submitPayload.subStaff) return

				const subStaff = $scope.submitPayload.subStaff
				const previousSchoolNumber = staffRecord.prev_school_number || staffRecord.homeschoolid || subStaff.prev_school_number
				const previousSchoolName = staffRecord.prev_school_name || staffRecord.homeschoolname || subStaff.prev_school_name

				// Merge only PS identity data so the LTS request keeps its school, deadline, notes, and subbing-for staff.
				angular.extend(subStaff, {
					users_dcid: staffRecord.identifier || staffRecord.users_dcid || subStaff.users_dcid,
					title: staffRecord.title || subStaff.title,
					first_name: staffRecord.first_name || subStaff.first_name,
					last_name: staffRecord.last_name || subStaff.last_name,
					license_microsoft: staffRecord.license_microsoft || subStaff.license_microsoft,
					prev_school_number: previousSchoolNumber || subStaff.prev_school_number,
					prev_school_name: previousSchoolName || subStaff.prev_school_name
				})

				removeNullableTitleFields(subStaff)
				fillPreviousSchoolNameFromSchoolData(subStaff)
				setSubstituteSchoolStaffRecordData(staffRecord)
			}

			// Older LTS records may lack newer link fields, so edit hydration tries the linked user first and falls back to names.
			const hydrateLongTermSubstituteOnEdit = subStaff => {
				if (!subStaff) return $q.when()

				const preload = {}
				if (!$scope.schoolData) preload.schools = $scope.getJSONData('schoolData')

				return $q.all(preload).then(() => {
					if (!subStaff.users_dcid || subStaff.users_dcid == -1) {
						fillPreviousSchoolNameFromSchoolData(subStaff)
						if (!subStaff.prev_school_number || !subStaff.first_name || !subStaff.last_name) return

						// Legacy LTS submissions may not have users_dcid, so keep the old name-based staff record lookup as fallback.
						return $scope.getJSONData('substituteSchoolStaffRecordData', {
							first_name: subStaff.first_name,
							last_name: subStaff.last_name
						})
					}

					return $scope
						.getJSONData('userData', {
							curSchoolID: '0',
							staffStatus: '1,2'
						})
						.then(userRecords => {
							const linkedUser = userRecords.find(userRecord => sameIdentifier(userRecord.identifier, subStaff.users_dcid))

							if (linkedUser) {
								if (!subStaff.title) subStaff.title = linkedUser.title
								if (!subStaff.first_name) subStaff.first_name = linkedUser.first_name
								if (!subStaff.last_name) subStaff.last_name = linkedUser.last_name
								if (!subStaff.license_microsoft) subStaff.license_microsoft = linkedUser.license_microsoft
								if (!subStaff.prev_school_number) subStaff.prev_school_number = linkedUser.homeschoolid
								if (!subStaff.prev_school_name) subStaff.prev_school_name = linkedUser.homeschoolname
							}

							fillPreviousSchoolNameFromSchoolData(subStaff)

							const schoolStaffParams = {
								userDCID: subStaff.users_dcid,
								schoolID: subStaff.prev_school_number || subStaff.schoolid || $scope.userContext.curSchoolId
							}

							return $scope.getJSONData('schoolStaffRecordData', schoolStaffParams).then(schoolStaffRecords => {
								if (schoolStaffRecords && schoolStaffRecords.length) {
									$scope.substituteSchoolStaffRecordData = schoolStaffRecords
								}
							})
						})
				})
			}

			// Edit pages load the saved API record, then preload every lookup needed to render its current selections.
			$scope.getStaffChange = staffChangeId => {
				loadingDialog()

				if (!staffChangeId) {
					closeLoading()
					return $q.when()
				}

				return psApiService
					.psApiCall('U_CDOL_STAFF_CHANGES', 'GET', {}, staffChangeId)
					.then(res => {
						normalizePayloadLookupIdentifiers(res)
						$scope.submitPayload[res.change_type] = res
						$scope.userContext.pageContext = res.change_type
						$scope.originalChangeType = res.change_type
						$scope.originalStaffChangePayloads[res.change_type] = copyPayload(res)
						$scope.originalJitbitSnapshots[res.change_type] = buildJitbitSnapshot(res)
						const preload = {}
						preload.formLookups = $scope.loadFormLookups(res.change_type)

						if ($scope.userContext.pageContext === 'newStaff' || $scope.userContext.pageContext === 'subStaff') {
							preload.duplicates = $scope.checkDupesOnEdit(res)
						}
						if ($scope.userContext.pageContext === 'transferringStaff' || $scope.userContext.pageContext === 'jobChange' || $scope.userContext.pageContext === 'nameChange' || $scope.userContext.pageContext === 'exitingStaff') {
							const schoolStaffParams = {
								userDCID: $scope.submitPayload[res.change_type].users_dcid,
								schoolID: $scope.userContext.pageContext === 'transferringStaff' ? $scope.submitPayload[res.change_type].prev_school_number : $scope.submitPayload[res.change_type].schoolid
							}
							preload.schoolStaff = $scope.getJSONData('schoolStaffRecordData', schoolStaffParams)
						}
						if (isLongTermSubstitute(res)) {
							preload.longTermSubstitute = hydrateLongTermSubstituteOnEdit($scope.submitPayload.subStaff)
						} else if ($scope.userContext.pageContext === 'subStaff' && $scope.submitPayload[res.change_type].prev_school_number) {
							const subPrevStaffParams = {
								first_name: $scope.submitPayload[res.change_type].first_name,
								last_name: $scope.submitPayload[res.change_type].last_name
							}
							preload.previousSubstitute = $scope.getJSONData('substituteSchoolStaffRecordData', subPrevStaffParams)
						}

						return $q.all(preload)
					})
					.finally(closeLoading)
			}
			// A staffChangeId is supplied only for Edit mode; Submit mode starts with an empty payload.
			if ($scope.userContext.staffChangeId) {
				$scope.getStaffChange($scope.userContext.staffChangeId)
			}
			// Cache the latest parameter signature on this scope. Repeated template/controller requests with the same
			// parameters receive an already-resolved $q promise instead of issuing another HTTP request.
			$scope.getJSONData = (resource, params = {}) => {
				const paramSignature = JSON.stringify(params)
				const paramSignatureKey = `${resource}ParamSignature`

				if ($scope[resource] && $scope[paramSignatureKey] === paramSignature) {
					return $q.when($scope[resource])
				}

				return jsonDataService.getData(resource, params).then(records => {
					$scope[paramSignatureKey] = paramSignature
					$scope[resource] = records
					return $scope[resource]
				})
			}
			$scope.getJSONData('titleData').catch(() => {
				$scope.titleData = []
			})

			$scope.checkDupesOnEdit = staffToSearch => {
				let staffDupeParams = {
					firstName: staffToSearch.first_name,
					lastName: staffToSearch.last_name
				}
				if (staffToSearch.maiden_name) staffDupeParams.maidenName = staffToSearch.maiden_name

				return $scope.getJSONData('duplicatePowerSchoolStaffData', staffDupeParams)
			}

			// Duplicate checks run in sequence: first existing staff-change requests, then PowerSchool users when applicable.
			$scope.dupeSearch = (pageContext, formPayload, searchType) => {
				if ($scope.duplicateStaffChangeData) {
					delete $scope.duplicateStaffChangeData
				}

				const searchSubmittedStaff = pageContext === 'subStaff' || !formPayload.replace_first_name

				let staffChangeDupeParams = {
					changeType: 'allStaff',
					calendarYear: new Date().getFullYear().toString(),
					curSchoolID: searchSubmittedStaff ? $scope.userContext.curSchoolId : formPayload.replace_homeschoolid,
					firstName: searchSubmittedStaff ? formPayload.first_name : formPayload.replace_first_name
				}

				if (searchType === 'maiden') {
					staffChangeDupeParams.lastName = formPayload.maiden_name
				} else {
					staffChangeDupeParams.lastName = searchSubmittedStaff ? formPayload.last_name : formPayload.replace_last_name
				}

				return $scope.getJSONData('duplicateStaffChangeData', staffChangeDupeParams).then(() => {
					if (pageContext === 'newStaff' || pageContext === 'transferringStaff' || pageContext === 'subStaff') {
						$scope.duplicateStaffChangeData = $scope.duplicateStaffChangeData.filter(item => item.change_type === 'newStaff' || item.change_type === 'transferringStaff' || item.change_type === 'subStaff')
					} else {
						$scope.duplicateStaffChangeData = $scope.duplicateStaffChangeData.filter(item => item.change_type === pageContext)
					}

					if ($scope.duplicateStaffChangeData.length > 0) {
						$scope.openDialog('staffChangeDupe')
						return
					}

					const shouldSearchPowerSchoolStaff = pageContext === 'newStaff' || (pageContext === 'subStaff' && formPayload.sub_type === 'LTS')
					if (!shouldSearchPowerSchoolStaff) return
					if ($scope.duplicatePowerSchoolStaffData) delete $scope.duplicatePowerSchoolStaffData

					const staffDupeParams = {
						firstName: formPayload.first_name,
						lastName: formPayload.last_name
					}
					if (formPayload.maiden_name) staffDupeParams.maidenName = formPayload.maiden_name

					return $scope.getJSONData('duplicatePowerSchoolStaffData', staffDupeParams).then(() => {
						if ($scope.duplicatePowerSchoolStaffData.length > 0) {
							$scope.openDialog('staffDupe')
						}
					})
				})
			}
			// Form directives watch pageContext. Changing it swaps the visible form while this controller retains shared state.
			$scope.formDisplay = (pageContext, prevContext, direction) => {
				$scope.userContext.pageContext = pageContext
				$scope.userContext.prevContext = prevContext

				const preload = {
					formLookups: $scope.loadFormLookups(pageContext)
				}

				return $q.all(preload).then(() => {
					switch (direction) {
						case 'reset':
							if ($scope.userContext.pageContext !== $scope.userContext.prevContext) {
								delete $scope.submitPayload[prevContext]
							}
							break
						case 'back':
							if ($scope.userContext.pageContext === $scope.userContext.prevContext) {
								if ($scope.submitPayload[pageContext].leaving_radio == 1) {
									delete $scope.submitPayload.exitingStaff
								}
								if ($scope.submitPayload[pageContext].position_radio == 1) {
									delete $scope.submitPayload.jobChange
								}
							}
							break
						case 'forward':
							$scope.updateAdditionalPayload(prevContext)
							delete $scope.duplicateStaffChangeData
							break
						case 'convert':
							$scope.submitPayload[pageContext] = angular.copy($scope.submitPayload[prevContext])
							delete $scope.submitPayload[prevContext]
					}
					scrollToFormTop()
				})
			}

			// ng-change calls this after a lookup selection. It translates the selected option into intentional payload fields.
			$scope.updateScopeFromDropdown = (pageContext, resource, identifier, field, optionRecords) => {
				//if dropdown source is user data
				if (resource === 'userData') {
					//if the field is the users_dcid find all the fields related to that user and set them in the submit payload
					if (field === 'users_dcid') {
						$scope.submitPayload[pageContext] = { [field]: identifier }
					}
				}
				//if dropdown source is school data
				if (resource === 'schoolData') {
					// Manual employer entry uses -1 and starts with an empty employer name.
					if (identifier == -1) {
						$scope.submitPayload[pageContext].prev_school_name = ''
					}
				}
				// Only map records selected from a lookup; -1 is reserved for manual entry.
				if ((identifier || identifier === 0) && identifier != -1) {
					// find the field in the dataset (resource) passed in
					const lookupRecords = optionRecords || $scope[resource] || []
					let foundItem = lookupRecords.find(item => sameIdentifier(item.identifier, identifier))

					if (!foundItem) {
						psAlert({
							title: 'Staff Lookup Error',
							message: 'The selected staff member could not be loaded. Please reselect the staff member before continuing.'
						})
						return
					}
					//if the resource is school data then set the prev_school_name to the school name of the dataset (resource) passed in
					if (resource === 'schoolData') {
						$scope.submitPayload[pageContext].prev_school_name = foundItem.schoolname
					}
					//if the resource is user data
					if (resource === 'userData') {
						//and the field is users_dcid
						if (field === 'users_dcid') {
							copyPrimaryStaffFromUser($scope.submitPayload[pageContext], foundItem)
							removeNullableTitleFields($scope.submitPayload[pageContext])

							if (pageContext === 'nameChange') {
								if ($scope.submitPayload[pageContext].title === 'Fr.' || $scope.submitPayload[pageContext].title === 'Msgr.' || $scope.submitPayload[pageContext].title === 'Sr.' || $scope.submitPayload[pageContext].title === 'Br.') {
									$scope.submitPayload[pageContext].title = ''
								}
								$scope.submitPayload[pageContext].old_name_placeholder = formatService.formatStaffFullName($scope.submitPayload[pageContext])
							}
							if (pageContext === 'transferringStaff') {
								copyPreviousSchoolFromUser($scope.submitPayload[pageContext], foundItem)
							}
							if (pageContext === 'newStaff') {
								copyPreviousSchoolFromUser($scope.submitPayload[pageContext], foundItem)
							}
							if (pageContext === 'subStaff') {
								copyPreviousSchoolFromUser($scope.submitPayload[pageContext], foundItem)
							}
							if (pageContext === 'exitingStaff') {
								$scope.submitPayload[pageContext].old_name_placeholder = formatService.formatStaffFullName($scope.submitPayload[pageContext])
							}
							removeLookupOnlyFields($scope.submitPayload[pageContext])
						}
						// Dynamically handle both replace_ and canva_ prefixes
						if (field === 'replace_dcid' || field === 'canva_dcid') {
							// Determine the prefix dynamically based on the field
							const prefix = field === 'replace_dcid' ? 'replace_' : 'canva_'
							copyPrefixedStaffFromUser($scope.submitPayload[pageContext], foundItem, prefix, {
								skipLicenseMicrosoft: prefix === 'canva_'
							})
							removeNullableTitleFields($scope.submitPayload[pageContext])
							removeLookupOnlyFields($scope.submitPayload[pageContext], prefix)
						}

						if (pageContext === 'subStaff') {
							$scope.submitPayload[pageContext].license_microsoft = $scope.submitPayload[pageContext].replace_license_microsoft
						}
					}
				}
			}

			// These groups define which lookup-derived values must be cleared when toggling between select and manual modes.
			const manualLookupFields = {
				users_dcid: ['users_dcid', 'title', 'first_name', 'middle_name', 'last_name', 'license_microsoft', 'staff_status', 'prev_school_number', 'prev_school_name', 'old_name_placeholder'],
				replace_dcid: ['replace_dcid', 'replace_title', 'replace_first_name', 'replace_middle_name', 'replace_last_name', 'replace_license_microsoft', 'replace_homeschoolid', 'replace_homeschoolname', 'replace_staff_status'],
				canva_dcid: ['canva_dcid', 'canva_title', 'canva_first_name', 'canva_middle_name', 'canva_last_name', 'canva_homeschoolid', 'canva_homeschoolname', 'canva_staff_status'],
				prev_school_number: ['prev_school_number', 'prev_school_name']
			}

			const clearManualLookupFields = (formPayload, lookupField) => {
				const fieldNames = manualLookupFields[lookupField] || [lookupField]
				fieldNames.forEach(fieldName => delete formPayload[fieldName])
			}

			const focusFormControl = controlId => {
				if (!controlId) return

				$window.requestAnimationFrame(() => {
					const formControl = $window.document.getElementById(controlId)
					if (formControl) formControl.focus()
				})
			}

			// The sentinel value -1 tells templates to hide a select and reveal its manual-entry controls.
			$scope.startManualLookup = (pageContext, lookupField, focusControlId) => {
				if (lookupField === 'users_dcid') {
					// Primary staff selection previously replaced the payload when Other was selected.
					$scope.submitPayload[pageContext] = { users_dcid: '-1' }
				} else {
					const formPayload = $scope.submitPayload[pageContext] || {}
					clearManualLookupFields(formPayload, lookupField)
					formPayload[lookupField] = '-1'
				}

				focusFormControl(focusControlId)
			}

			$scope.searchLookup = (pageContext, lookupField, selectId) => {
				const formPayload = $scope.submitPayload[pageContext] || {}
				clearManualLookupFields(formPayload, lookupField)

				$window.requestAnimationFrame(() => {
					$window.requestAnimationFrame(() => {
						const selectElement = $j(`#${selectId}`)
						if (selectElement.hasClass('select2-hidden-accessible')) selectElement.select2('open')
						else if (selectElement.length) selectElement[0].focus()
					})
				})
			}

			// Convert a duplicate New Staff request without carrying lookup-only fields into the new payload.
			$scope.newToTransferringIn = identifier => {
				// Step 1: Copy all properties from newStaff (if it exists)
				const newStaff = $scope.submitPayload.newStaff || {}
				$scope.submitPayload.transferringStaff = angular.copy(newStaff)
				$scope.submitPayload.transferringStaff.users_dcid = identifier

				// Step 2: Find the matching item
				let foundItem = $scope.duplicatePowerSchoolStaffData && $scope.duplicatePowerSchoolStaffData.length && $scope.duplicatePowerSchoolStaffData.find(item => item.identifier === identifier)

				// Step 3: Override only intended PowerSchool identity fields from foundItem
				copyTransferringStaffFromDuplicate($scope.submitPayload.transferringStaff, foundItem)
				// Step 4: Remove newStaff
				delete $scope.submitPayload.newStaff
				$scope.userContext.formType = 'transferringStaff'
				$scope.userContext.formTypeHover = 'transferringStaff'
			}

			$scope.useExistingSubstituteStaff = identifier => {
				const foundItem = $scope.duplicatePowerSchoolStaffData && $scope.duplicatePowerSchoolStaffData.find(item => sameIdentifier(item.identifier, identifier))
				hydrateSubstituteFromStaffRecord(foundItem)
			}

			$scope.checkStaffType = staffType => {
				if (staffType === '4') {
					$scope.openDialog('subChange')
				}
			}

			$scope.copyNames = pageContext => {
				$scope.submitPayload[pageContext].legal_first_name = $scope.submitPayload[pageContext].first_name
				$scope.submitPayload[pageContext].legal_middle_name = $scope.submitPayload[pageContext].middle_name
				$scope.submitPayload[pageContext].legal_last_name = $scope.submitPayload[pageContext].last_name
			}

			// Replacement answers can create a second related change; start it with submission metadata shared by all records.
			const createAdditionalPayload = () => {
				return $scope.userContext.pageStatus === 'Submit' ? { deadline: $scope.userContext.tempDeadline } : {}
			}

			$scope.updateAdditionalPayload = pageContext => {
				if ($scope.submitPayload[pageContext].leaving_radio == 1) {
					$scope.submitPayload.exitingStaff = createAdditionalPayload()
					$scope.submitPayload.exitingStaff.users_dcid = $scope.submitPayload[pageContext].replace_dcid
					$scope.submitPayload.exitingStaff.title = $scope.submitPayload[pageContext].replace_title
					$scope.submitPayload.exitingStaff.first_name = $scope.submitPayload[pageContext].replace_first_name
					$scope.submitPayload.exitingStaff.middle_name = $scope.submitPayload[pageContext].replace_middle_name
					$scope.submitPayload.exitingStaff.last_name = $scope.submitPayload[pageContext].replace_last_name
					$scope.submitPayload.exitingStaff.replace_dcid = $scope.submitPayload[pageContext].users_dcid
					$scope.submitPayload.exitingStaff.replace_title = $scope.submitPayload[pageContext].title
					$scope.submitPayload.exitingStaff.replace_first_name = $scope.submitPayload[pageContext].first_name
					$scope.submitPayload.exitingStaff.replace_middle_name = $scope.submitPayload[pageContext].middle_name
					$scope.submitPayload.exitingStaff.replace_last_name = $scope.submitPayload[pageContext].last_name
					$scope.submitPayload.exitingStaff.notes = $scope.submitPayload[pageContext].notes
				}
				if ($scope.submitPayload[pageContext].leaving_radio == 0) {
					delete $scope.submitPayload.exitingStaff
				}
				if ($scope.submitPayload[pageContext].position_radio == 1) {
					$scope.submitPayload.jobChange = createAdditionalPayload()
					$scope.submitPayload.jobChange.users_dcid = $scope.submitPayload[pageContext].replace_dcid
					$scope.submitPayload.jobChange.title = $scope.submitPayload[pageContext].replace_title
					$scope.submitPayload.jobChange.first_name = $scope.submitPayload[pageContext].replace_first_name
					$scope.submitPayload.jobChange.middle_name = $scope.submitPayload[pageContext].replace_middle_name
					$scope.submitPayload.jobChange.last_name = $scope.submitPayload[pageContext].replace_last_name
					$scope.submitPayload.jobChange.replace_dcid = $scope.submitPayload[pageContext].users_dcid
					$scope.submitPayload.jobChange.replace_title = $scope.submitPayload[pageContext].title
					$scope.submitPayload.jobChange.replace_first_name = $scope.submitPayload[pageContext].first_name
					$scope.submitPayload.jobChange.replace_middle_name = $scope.submitPayload[pageContext].middle_name
					$scope.submitPayload.jobChange.replace_last_name = $scope.submitPayload[pageContext].last_name
					$scope.submitPayload.jobChange.notes = $scope.submitPayload[pageContext].notes
				}
				if ($scope.submitPayload[pageContext].position_radio == 0) {
					delete $scope.submitPayload.jobChange
				}

				if ($scope.submitPayload[pageContext].prev_school_radio == 0) {
					delete $scope.submitPayload[pageContext].prev_school_number
					delete $scope.submitPayload[pageContext].prev_school_name
				}

				if ($scope.submitPayload[pageContext].exit_radio == 0) {
					formatService.objIterator($scope.submitPayload[pageContext], ['replace_'], 'deleteKeys')
				}
			}

			const isMissingStaffName = formPayload => !formPayload.first_name || !formPayload.last_name
			const titleFields = ['title', 'replace_title', 'canva_title']
			// Jitbit snapshots contain only ticket-relevant values, which prevents unrelated edits from triggering a ticket update.
			const SUPPORT_TICKET_URL = 'https://cdol.jitbit.com/Tickets/New?categoryId=585011'

			const normalizeDeadlineForComparison = deadline => {
				if (!deadline) return ''

				const dateParts = deadline.split('/')
				if (dateParts.length !== 3) return deadline

				return `${Number(dateParts[0])}/${Number(dateParts[1])}/${dateParts[2]}`
			}

			const copyPayload = payload => angular.copy(payload || {})

			const getReadableChangeType = formPayload => (formPayload.change_type === 'subStaff' ? `${formatService.changeMap(formPayload.change_type)} (${formPayload.sub_type})` : `${formatService.changeMap(formPayload.change_type)}`)

			const buildJitbitPayload = formPayload => {
				const jitbitPayload = angular.copy(formPayload)
				return angular.extend(jitbitPayload, {
					curUserName: $scope.userContext.curUserName,
					curUserSchoolAbbr: $scope.userContext.curUserSchoolAbbr,
					curDate: $scope.userContext.curDate,
					curTime: $scope.userContext.curTime,
					userEmail: $scope.userContext.curUserEmail,
					isTestServer: $scope.userContext.isTestServer,
					emergencyRequest: $scope.userContext.pageStatus === 'Submit' && $scope.isEmergencyRequestEnabled(formPayload.change_type),
					readableChangeType: getReadableChangeType(formPayload)
				})
			}

			const buildJitbitSnapshot = formPayload => {
				const jitbitPayload = buildJitbitPayload(formPayload)
				const ticketPayload = jitbitService.buildTicketPayload(jitbitPayload, null)

				return {
					subject: ticketPayload.subject,
					body: ticketPayload.body.replace(/Submission from[\s\S]*$/, '').trim(),
					customFields: ticketPayload.customFields,
					deadline: normalizeDeadlineForComparison(jitbitPayload.deadline)
				}
			}

			const hasJitbitSnapshotChanged = (originalSnapshot, currentSnapshot) => JSON.stringify(originalSnapshot || {}) !== JSON.stringify(currentSnapshot || {})

			const formatJitbitDueDate = deadline => `${formatService.formatDateForApi(deadline)}T23:59:00Z`

			const jitbitSupportMessage = message => `${message} Please take a screenshot of this error and attach it to a new support ticket by <a href="${SUPPORT_TICKET_URL}" target="_blank" rel="noopener noreferrer">clicking here</a>.`

			const showJitbitSupportError = (title, message, error) => {
				console.error(title, error)
				let hasRedirected = false
				const redirectToList = () => {
					if (hasRedirected) return
					hasRedirected = true
					$scope.toListRedirect($scope.userContext.pageContext)
				}

				psDialog({
					type: 'dialogM',
					width: 600,
					title: title,
					content: `<p>${jitbitSupportMessage(message)}</p>`,
					close: redirectToList,
					buttons: [
						{
							id: 'jitbitErrorOkButton',
							text: 'OK',
							title: 'OK',
							click: function () {
								psDialogClose()
								redirectToList()
							}
						}
					]
				})
			}

			const getCreateJitbitErrorMessage = error => {
				switch (error && error.jitbitStage) {
					case 'requesterLookup':
						return 'The staff change was not submitted because the Jitbit requester could not be found.'
					case 'ticketCreate':
						return 'The staff change was not submitted because the Jitbit ticket could not be created.'
					case 'dueDateUpdate':
						return 'The staff change was not submitted because the Jitbit ticket due date could not be updated.'
					default:
						return 'The Jitbit ticket update failed, so the staff change was not submitted.'
				}
			}

			const getEditJitbitErrorMessage = error => {
				switch (error && error.jitbitStage) {
					case 'ticketFetch':
						return 'The staff change was not updated because the existing Jitbit ticket could not be loaded.'
					case 'ticketUpdate':
						return 'The staff change was not updated because the Jitbit ticket could not be updated.'
					default:
						return 'The Jitbit ticket update failed, so the PowerSchool staff change was restored to its previous values.'
				}
			}

			const getDeleteJitbitErrorMessage = error => {
				switch (error && error.jitbitStage) {
					case 'ticketClose':
						return 'The staff change was not deleted because the Jitbit ticket could not be closed silently.'
					default:
						return 'The staff change was not deleted because the Jitbit ticket cleanup failed.'
				}
			}

			const restorePowerSchoolPayload = () => {
				const originalPayload = copyPayload($scope.originalStaffChangePayloads[$scope.originalChangeType])
				return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'PUT', originalPayload, $scope.userContext.staffChangeId)
			}

			const removeNullableTitleFields = formPayload => {
				if (!formPayload) return formPayload

				titleFields.forEach(titleField => {
					if (Object.prototype.hasOwnProperty.call(formPayload, titleField) && formPayload[titleField] == null) {
						delete formPayload[titleField]
					}
				})

				return formPayload
			}

			const findUserDataByDcid = dcid => {
				if (!dcid || !$scope.userData) return
				return $scope.userData.find(user => user.identifier && user.identifier.toString() === dcid.toString())
			}

			$scope.hydrateTransferringStaffName = formPayload => {
				if (formPayload.change_type !== 'transferringStaff' || !formPayload.users_dcid || formPayload.users_dcid == -1 || !isMissingStaffName(formPayload)) {
					return $q.when(true)
				}

				return $scope
					.getJSONData('userData', {
						curSchoolID: '0',
						staffStatus: '1,2'
					})
					.then(() => {
						const foundStaff = findUserDataByDcid(formPayload.users_dcid)
						if (!foundStaff) return false
						;['title', 'first_name', 'last_name', 'gender', 'license_microsoft', 'staff_status'].forEach(key => {
							formPayload[key] = foundStaff[key]
						})
						removeNullableTitleFields(formPayload)
						formPayload.prev_school_number = formPayload.prev_school_number || foundStaff.homeschoolid
						formPayload.prev_school_name = formPayload.prev_school_name || foundStaff.homeschoolname
						return !isMissingStaffName(formPayload)
					})
			}

			const ipadRequiredChangeTypes = ['newStaff', 'transferringStaff', 'jobChange', 'nameChange', 'exitingStaff']
			const hasIpadAnswer = formPayload => formPayload.ipad_needed === '0' || formPayload.ipad_needed === '1'
			const requiresIpadAnswer = formPayload => {
				return ipadRequiredChangeTypes.includes(formPayload.change_type) || (formPayload.change_type === 'subStaff' && formPayload.sub_type === 'LTS')
			}
			$scope.resetIpadCompletion = pageContext => {
				if ($scope.userContext.pageStatus !== 'Edit' || !$scope.submitPayload[pageContext]) return

				$scope.submitPayload[pageContext].ipad_created = false
				$scope.submitPayload[pageContext].ipad_ignored = false
			}

			const validateIpadAnswer = formPayload => {
				if ($scope.userContext.pageStatus !== 'Submit' || !requiresIpadAnswer(formPayload) || hasIpadAnswer(formPayload)) {
					return true
				}

				psAlert({
					title: 'iPad Information Required',
					message: 'Please select Yes or No in the iPad Information section before submitting this staff change.'
				})
				return false
			}

			// Validation returns a promise because linked staff hydration may require an asynchronous lookup before saving.
			$scope.validateStaffChangePayload = formPayload => {
				if (!validateIpadAnswer(formPayload)) return $q.when(false)
				if (formPayload.change_type !== 'transferringStaff') return $q.when(true)

				return $scope.hydrateTransferringStaffName(formPayload).then(hydrated => {
					if (hydrated && !isMissingStaffName(formPayload)) return true

					psAlert({
						title: 'Missing Transferring-In Staff Name',
						message: 'The selected transferring-in staff member did not load a first and last name. Please reselect the staff member and submit again.'
					})
					return false
				})
			}

			// Create each payload sequentially so a related record failure is reported before navigation leaves the page.
			$scope.createStaffChange = () => {
				loadingDialog()
				const commonPayload = {
					schoolid: $scope.userContext.curSchoolId,
					calendar_year: new Date().getFullYear().toString(),
					submission_date: $scope.userContext.curDate,
					submission_time: $scope.userContext.curTime,
					who_submitted: $scope.userContext.curUserDcid
				}
				const payloadKeys = Object.keys($scope.submitPayload)

				const processPayload = key => {
					let formPayload = $scope.submitPayload[key]
					formPayload.change_type = key
					removeNullableTitleFields(formPayload)

					if (!$scope.checkIfBusinessDay(key)) {
						return $q.reject({ handled: true })
					}

					return $scope
						.validateStaffChangePayload(formPayload)
						.then(isValid => {
							if (!isValid) return $q.reject({ handled: true })

							appendEmergencyReasonToNotes(formPayload, key)

							if (formPayload.change_type == 'exitingStaff') {
								formPayload.old_name_placeholder = formatService.formatStaffFullName(formPayload)
							}
							if (formPayload.change_type == 'subStaff') {
								formPayload.staff_type = '4'
								if (formPayload.sub_type == 'FSTS') {
									formPayload.license_microsoft = 'A1'
								}
								formPayload.position = formPayload.sub_type
							}

							angular.extend(formPayload, commonPayload)
							return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'POST', formPayload)
						})
						.then(staffChangeId => {
							formPayload.staffChangeId = staffChangeId
							if (!$scope.userContext.sendJitbit) return

							let jitbitTicketId
							return jitbitService
								.createJitbitTicket(buildJitbitPayload(formPayload))
								.then(ticketId => {
									jitbitTicketId = ticketId
									return jitbitService.updateJitbitTicket(
										{
											id: jitbitTicketId,
											dueDate: formatJitbitDueDate(formPayload.deadline)
										},
										{ errorStage: 'dueDateUpdate' }
									)
								})
								.then(() => {
									return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'PUT', { ticket_id: jitbitTicketId }, staffChangeId)
								})
								.then(() => {
									formPayload.ticket_id = jitbitTicketId
								})
								.catch(error => {
									return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'DELETE', {}, staffChangeId).then(
										() => {
											showJitbitSupportError('Jitbit Ticket Error', getCreateJitbitErrorMessage(error), error)
											return $q.reject({ handled: true })
										},
										rollbackError => {
											showJitbitSupportError('Manual Cleanup Needed', 'The Jitbit ticket update failed, and the staff change may have been partially saved in PowerSchool.', { error: error, rollbackError: rollbackError })
											return $q.reject({ handled: true })
										}
									)
								})
						})
				}

				return payloadKeys
					.reduce((promise, key) => {
						return promise.then(() => processPayload(key))
					}, $q.when())
					.then(() => {
						return $scope.formDisplay('confirm', $scope.userContext.pageContext)
					})
					.catch(error => {
						if (!error || !error.handled) console.error('Staff change submission failed.', error)
					})
					.finally(closeLoading)
			}

			// Edit saves also calculate completion state and synchronize Jitbit. If Jitbit fails, PowerSchool is restored
			// from originalStaffChangePayloads so the two systems do not silently disagree.
			$scope.updateStaffChange = form => {
				loadingDialog()
				const payloadKeys = Object.keys($scope.submitPayload)

				const processPayload = key => {
					let formPayload = $scope.submitPayload[key]
					formPayload.change_type = key
					removeNullableTitleFields(formPayload)
					const currentJitbitSnapshot = buildJitbitSnapshot(formPayload)
					const shouldSyncJitbitTicket = $scope.userContext.sendJitbit && $scope.userContext.pageStatus === 'Edit' && formPayload.ticket_id && hasJitbitSnapshotChanged($scope.originalJitbitSnapshots[$scope.originalChangeType], currentJitbitSnapshot)

					return $scope.validateStaffChangePayload(formPayload).then(isValid => {
						if (!isValid) return $q.reject({ handled: true })

						const isResolved = (payload, fieldName) => payload[`${fieldName}_created`] || payload[`${fieldName}_ignored`]
						const commonChecksComplete = payload => payload.ps_created && isResolved(payload, 'ad')
						// Only an explicit Yes makes iPad work applicable; No and legacy blanks remain complete without iPad checks.
						const ipadComplete = payload => payload.ipad_needed != 1 || isResolved(payload, 'ipad')
						const canvaComplete = payload => payload.canva_transfer !== '1' || isResolved(payload, 'canva')
						let allApplicableChecksComplete = false

						switch (key) {
							case 'newStaff':
							case 'transferringStaff':
								allApplicableChecksComplete = commonChecksComplete(formPayload) && isResolved(formPayload, 'o365') && isResolved(formPayload, 'lms') && isResolved(formPayload, 'canva') && ipadComplete(formPayload)
								break

							case 'nameChange':
								allApplicableChecksComplete = commonChecksComplete(formPayload) && isResolved(formPayload, 'o365') && isResolved(formPayload, 'lms') && canvaComplete(formPayload) && ipadComplete(formPayload)
								break

							case 'jobChange':
								allApplicableChecksComplete = commonChecksComplete(formPayload) && ipadComplete(formPayload)
								break

							case 'exitingStaff':
								allApplicableChecksComplete = commonChecksComplete(formPayload) && canvaComplete(formPayload) && ipadComplete(formPayload)
								break

							case 'subStaff':
								if (formPayload.sub_type === 'FSTS') {
									allApplicableChecksComplete = isResolved(formPayload, 'o365') && isResolved(formPayload, 'ad')
								} else if (formPayload.sub_type === 'LTS') {
									allApplicableChecksComplete = commonChecksComplete(formPayload) && isResolved(formPayload, 'o365') && isResolved(formPayload, 'lms') && ipadComplete(formPayload)
								}
								break
						}

						if (allApplicableChecksComplete && !formPayload.final_completion_date) {
							formPayload.final_completion_date = $scope.userContext.curDate
						} else if (!allApplicableChecksComplete && formPayload.final_completion_date) {
							formPayload.final_completion_date = undefined
						}

						if (!$scope.userContext.staffChangeId) return

						return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'PUT', formPayload, $scope.userContext.staffChangeId).then(() => {
							if (!shouldSyncJitbitTicket) return

							return jitbitService.syncJitbitTicketFromStaffChange(formPayload.ticket_id, buildJitbitPayload(formPayload), formatJitbitDueDate(formPayload.deadline)).catch(error => {
								return restorePowerSchoolPayload().then(
									() => {
										showJitbitSupportError('Jitbit Ticket Error', getEditJitbitErrorMessage(error), error)
										return $q.reject({ handled: true })
									},
									restoreError => {
										showJitbitSupportError('Manual Cleanup Needed', 'The Jitbit ticket update failed, and PowerSchool may not match the Jitbit ticket.', { error: error, restoreError: restoreError })
										return $q.reject({ handled: true })
									}
								)
							})
						})
					})
				}

				return payloadKeys
					.reduce((promise, key) => {
						return promise.then(() => processPayload(key))
					}, $q.when())
					.then(() => {
						$scope.toListRedirect(form)
					})
					.catch(error => {
						if (!error || !error.handled) console.error('Staff change update failed.', error)
					})
					.finally(closeLoading)
			}

			// Close the external ticket before deleting the PowerSchool record; a ticket failure leaves the record intact.
			// Test servers suppress this unless the debug-panel Send Jitbit Ticket override is explicitly checked.
			$scope.deleteStaffChange = form => {
				loadingDialog()
				const formPayload = $scope.submitPayload[form] || {}
				const deletePromise = $scope.userContext.staffChangeId
					? ($scope.userContext.sendJitbit && formPayload.ticket_id ? jitbitService.closeJitbitTicketSilently(formPayload.ticket_id) : $q.when())
							.then(() => {
								return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'DELETE', {}, $scope.userContext.staffChangeId)
							})
							.then(() => {
								$scope.toListRedirect(form)
							})
					: $q.when()

				return deletePromise
					.catch(error => {
						console.error('Staff change deletion failed.', error)
						if (formPayload.ticket_id) {
							psAlert({
								title: 'Jitbit Ticket Error',
								message: getDeleteJitbitErrorMessage(error)
							})
						}
					})
					.finally(closeLoading)
			}

			$scope.openNewStaffRecord = newStaff => {
				sessionStorage.setItem('newStaffData', JSON.stringify(newStaff))
				window.open('/admin/faculty/new.html?frn=005-99', '_blank')
			}

			$scope.toListRedirect = form => {
				let redirectPath = '/admin/staff_change/list.html'
				switch (form) {
					case 'newStaff':
						redirectPath = `${redirectPath}#tabOneContent`
						break
					case 'transferringStaff':
						redirectPath = `${redirectPath}#tabTwoContent`
						break
					case 'jobChange':
						redirectPath = `${redirectPath}#tabThreeContent`
						break
					case 'subStaff':
						redirectPath = `${redirectPath}#tabFourContent`
						break
					case 'nameChange':
						redirectPath = `${redirectPath}#tabFiveContent`
						break
					case 'exitingStaff':
						redirectPath = `${redirectPath}#tabSixContent`
						break
					case 'allStaff':
						redirectPath = `${redirectPath}#tabSevenContent`
						break
					default:
						redirectPath
				}
				$window.location.href = redirectPath
			}
		}
	])

	// Filters are small formatting functions that templates can invoke with Angular's | syntax.
	module.filter('titleCase', function () {
		return function (input) {
			if (!input) return ''

			const capitalizeToken = function (token) {
				if (!token) return token

				const apostropheSeparator = /(['’])/g
				const apostropheOnly = /^['’]$/
				const segments = token.split(apostropheSeparator)
				let hasCapitalizedRoot = false

				for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
					const segment = segments[segmentIndex]
					if (!segment || apostropheOnly.test(segment)) continue

					const previousSegment = segments[segmentIndex - 1]
					const followsApostrophe = previousSegment && apostropheOnly.test(previousSegment)

					if (!followsApostrophe && !hasCapitalizedRoot) {
						segments[segmentIndex] = segment.charAt(0).toUpperCase() + segment.slice(1)
						hasCapitalizedRoot = true
						continue
					}

					if (followsApostrophe) {
						const isTrailingPossessive = /^[sS]$/.test(segment) && segmentIndex === segments.length - 1
						if (isTrailingPossessive) {
							segments[segmentIndex] = 's'
						} else {
							segments[segmentIndex] = segment.charAt(0).toUpperCase() + segment.slice(1)
						}
					}
				}

				return segments.join('')
			}

			return (
				input
					// Split by spaces and hyphens, then handle apostrophes per token.
					.split(/([ \-\–])/g)
					.map(function (word, index, array) {
						// Capitalize each token that starts a segment after a delimiter.
						if (index === 0 || array[index - 1].match(/[ \-\–']/)) {
							return capitalizeToken(word)
						}
						return word
					})
					.join('') // Combine array back into a string
					// Replace multiple spaces with a single space
					.replace(/\s{2,}/g, ' ')
					// Trim leading and trailing spaces
					.trim()
			)
		}
	})
	module.filter('sentenceCase', function () {
		return function (input) {
			if (!input) return ''
			// Split the input string by periods and map each sentence to sentence case
			return input
				.split('.')
				.map(sentence => {
					// Trim any leading and trailing spaces
					const trimmedSentence = sentence.trim()
					// Capitalize the first letter and convert the rest to lowercase
					return `${trimmedSentence.charAt(0).toUpperCase()}${trimmedSentence.slice(1).toLowerCase()}`
				})
				.join('. ')
		}
	})
	module.filter('staffFullName', [
		'formatService',
		function (formatService) {
			return function (staff, options) {
				return formatService.formatStaffFullName(staff, options)
			}
		}
	])
	const normalizeGender = gender =>
		String(gender || '')
			.trim()
			.toUpperCase()

	module.filter('possessivePronoun', function () {
		return function (gender) {
			const normalizedGender = normalizeGender(gender)

			if (normalizedGender === 'M' || normalizedGender === 'MALE') return 'his'
			if (normalizedGender === 'F' || normalizedGender === 'FEMALE') return 'her'
			return 'their'
		}
	})
	module.filter('subjectPronoun', function () {
		return function (gender) {
			const normalizedGender = normalizeGender(gender)

			if (normalizedGender === 'M' || normalizedGender === 'MALE') return 'he'
			if (normalizedGender === 'F' || normalizedGender === 'FEMALE') return 'she'
			return 'they'
		}
	})
	module.filter('objectPronoun', function () {
		return function (gender) {
			const normalizedGender = normalizeGender(gender)

			if (normalizedGender === 'M' || normalizedGender === 'MALE') return 'him'
			if (normalizedGender === 'F' || normalizedGender === 'FEMALE') return 'her'
			return 'them'
		}
	})
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

	module.filter('schoolName', function () {
		const map = {
			0: 'Diocesan Office',
			101: 'Pius X High School',
			102: 'Cathedral of the Risen Christ School',
			103: 'Sacred Heart Elementary School',
			104: 'St. John Lincoln',
			105: 'St. Joseph Lincoln',
			106: 'St. Mary Lincoln',
			107: 'St. Patrick Lincoln',
			108: 'St. Teresa Elementary School',
			109: 'Blessed Sacrament School',
			110: 'St. Peter Catholic School',
			111: 'North American Martyrs School',
			115: 'Bishop Neumann Catholic Jr/Sr High School',
			120: 'St. Michael Lincoln',
			130: 'Lourdes Central Catholic Middle/High School',
			131: 'Lourdes Central Catholic Elementary School',
			140: 'St. Wenceslaus Wahoo',
			150: 'All Saints Catholic School Holdrege',
			160: 'Aquinas Catholic Middle/High',
			164: 'Villa Marie School',
			184: 'St. Andrew Tecumseh',
			189: 'St. Cecilia Middle & High School',
			210: 'Falls City Sacred Heart Jr/Sr High School',
			211: 'Falls City Sacred Heart Elementary',
			260: 'St. Joseph Beatrice',
			261: 'St. Joseph York',
			262: 'St. John Nepomucene Weston',
			263: 'St. James Crete',
			264: 'Aquinas Catholic Elementary',
			272: 'St. Vincent de Paul Seward',
			282: 'St. John the Baptist School',
			310: 'St. Patrick McCook',
			437: 'St. Michael Hastings'
		}
		return function (input) {
			const key = Number(input)
			return map[key] || ''
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
