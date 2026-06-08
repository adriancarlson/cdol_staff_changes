'use strict'
define(function (require) {
	var angular = require('angular')
	var module = require('components/staff_change/module')

	module.controller('staffChangeCtrl', [
		'$scope',
		'$http',
		'$attrs',
		'$window',
		'$anchorScroll',
		'$location',
		'$q',
		'pqService',
		'formatService',
		'psApiService',
		'jitbitService',
		function ($scope, $http, $attrs, $window, $anchorScroll, $location, $q, pqService, formatService, psApiService, jitbitService) {
			//This is here for troubleshooting purposes.
			//Allows us to double click anywhere on the page and logs scope to console
			$j(document).dblclick(() => console.log($scope))

			$scope.refreshPage = function () {
				$window.location.reload()
			}

			let psDialogHolder = null

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

			//initializing overall form data
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
				isTestServer: $attrs.ngServerName && $attrs.ngServerName.indexOf('.test.') !== -1,
				sendJitbit: !($attrs.ngServerName && $attrs.ngServerName.indexOf('.test.') !== -1)
			}

			// checkbox change handler
			$scope.toggleJitbitCheckbox = () => {
				$scope.userContext.serverName = $scope.userContext.sendJitbit ? undefined : $attrs.ngServerName
			}

			// initializing date formatting for deadline field
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
					formPayload.notes = notes.slice(0, -(`\n\n${emergencyNote}`).length).trim()
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
							<textarea id="emergencyRequestReason" class="form-control" maxlength="250" spellcheck="true" wrap="soft" placeholder="${emergencyOverrideLabel}" style="min-height: 100px;"></textarea>
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

			// setting up universal formatKeys that will be used in API calls to format fields or delete fields
			$scope.formatKeys = {
				dateKeys: ['_date', 'dob', 'deadline'],
				checkBoxKeys: ['_created', '_ignored'],
				deleteKeys: ['_radio', 'homeschool', 'identifier', 'email_addr']
			}

			//initilazing empty payload
			$scope.submitPayload = {}
			$scope.originalStaffChangePayloads = {}
			$scope.originalJitbitSnapshots = {}
			$scope.originalChangeType = undefined

			//pull exiting Staff Change Record and setting it to submitPayload if an staffChangeId was provided through URL Params
			$scope.getStaffChange = staffChangeId => {
				loadingDialog()
				let getFormatKeys = angular.copy($scope.formatKeys)
				delete getFormatKeys['deleteKeys']

				if (!staffChangeId) {
					closeLoading()
					return $q.when()
				}

				return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'GET', getFormatKeys, staffChangeId).then(res => {
					$scope.submitPayload[res.change_type] = res
					$scope.userContext.pageContext = res.change_type
					$scope.originalChangeType = res.change_type
					$scope.originalStaffChangePayloads[res.change_type] = copyPayload(res)
					$scope.originalJitbitSnapshots[res.change_type] = buildJitbitSnapshot(res)
					const preload = {}

					if ($scope.userContext.pageContext === 'newStaff' || $scope.userContext.pageContext === 'subStaff') {
						preload.duplicates = $scope.checkDupesOnEdit(res)
					}
					if ($scope.userContext.pageContext === 'transferringStaff' || $scope.userContext.pageContext === 'jobChange' || $scope.userContext.pageContext === 'nameChange' || $scope.userContext.pageContext === 'exitingStaff') {
						const schoolStaffParams = {
							userDCID: $scope.submitPayload[res.change_type].users_dcid,
							schoolID: $scope.userContext.pageContext === 'transferringStaff' ? $scope.submitPayload[res.change_type].prev_school_number : $scope.submitPayload[res.change_type].schoolid
						}
						preload.schoolStaff = $scope.getJSONData('schoolStaffData', schoolStaffParams)
					}
					if ($scope.userContext.pageContext === 'subStaff' && $scope.submitPayload[res.change_type].prev_school_number) {
						const subPrevStaffParams = {
							first_name: $scope.submitPayload[res.change_type].first_name,
							last_name: $scope.submitPayload[res.change_type].last_name
						}
						preload.previousSubstitute = $scope.getJSONData('subPrevStaffData', subPrevStaffParams)
					}

					return $q.all(preload)
				}).finally(closeLoading)
			}
			//check if staffChangeId was provided through URL Params and then run getStaffChange function with that staffChangeId
			if ($scope.userContext.staffChangeId) {
				$scope.getStaffChange($scope.userContext.staffChangeId)
			}
			//had to switch from PQ's to pulling this data through t_list SQL and JSON files because of PowerSchools Data Restriction Framework on PQs
			$scope.getJSONData = (resource, params = {}) => {
				const paramSignature = JSON.stringify(params)
				const paramSignatureKey = `${resource}ParamSignature`

				if ($scope[resource] && $scope[paramSignatureKey] === paramSignature) {
					return $q.when($scope[resource])
				}

				return $http({
					url: `/admin/staff_change/json/${resource}.json`,
					method: 'GET',
					params: params
				}).then(res => {
					$scope[paramSignatureKey] = paramSignature
					$scope[resource] = res.data || []
					// Convert all numeric values in each object to strings.
					$scope[resource] = $scope[resource].map(obj => {
						const newObj = {}
						for (const key in obj) {
							if (obj.hasOwnProperty(key)) {
								newObj[key] = typeof obj[key] === 'number' ? obj[key].toString() : obj[key]
							}
						}
						return newObj
					})
					$scope[resource] = psUtils.htmlEntitiesToCharCode($scope[resource])
					return $scope[resource]
				})
			}

			$scope.checkDupesOnEdit = staffToSearch => {
				let staffDupeParams = {
					firstName: staffToSearch.first_name,
					lastName: staffToSearch.last_name
				}
				if (staffToSearch.maiden_name) staffDupeParams.maidenName = staffToSearch.maiden_name

				return $scope.getJSONData('staffDupeData', staffDupeParams)
			}

			$scope.dupeSearch = (pageContext, formPayload, searchType) => {
				if ($scope.staffChangeDupeData) {
					delete $scope.staffChangeDupeData
				}

				let staffChangeDupeParams = {
					changeType: 'allStaff',
					calendarYear: new Date().getFullYear().toString(),
					curSchoolID: formPayload.replace_first_name ? formPayload.replace_homeschoolid : $scope.userContext.curSchoolId,
					firstName: formPayload.replace_first_name ? formPayload.replace_first_name : formPayload.first_name
				}

				if (searchType === 'maiden') {
					staffChangeDupeParams.lastName = formPayload.maiden_name
				} else {
					staffChangeDupeParams.lastName = formPayload.replace_last_name ? formPayload.replace_last_name : formPayload.last_name
				}

				return $scope.getJSONData('staffChangeDupeData', staffChangeDupeParams).then(() => {
					if (pageContext === 'newStaff' || pageContext === 'transferringStaff' || pageContext === 'subStaff') {
						$scope.staffChangeDupeData = $scope.staffChangeDupeData.filter(item => item.change_type === 'newStaff' || item.change_type === 'transferringStaff' || item.change_type === 'subStaff')
					} else {
						$scope.staffChangeDupeData = $scope.staffChangeDupeData.filter(item => item.change_type === pageContext)
					}

					if ($scope.staffChangeDupeData.length > 0) {
						$scope.openDialog('staffChangeDupe')
						return
					}

					if (pageContext !== 'newStaff') return
					if ($scope.staffDupeData) delete $scope.staffDupeData

					const staffDupeParams = {
						firstName: formPayload.first_name,
						lastName: formPayload.last_name
					}
					if (formPayload.maiden_name) staffDupeParams.maidenName = formPayload.maiden_name

					return $scope.getJSONData('staffDupeData', staffDupeParams).then(() => {
						if ($scope.staffDupeData.length > 0) {
							$scope.openDialog('staffDupe')
						}
					})
				})
			}
			// function to switch forms and set scope to hold form data
			$scope.formDisplay = (pageContext, prevContext, direction) => {
				$scope.userContext.pageContext = pageContext
				$scope.userContext.prevContext = prevContext

				let usersDataParams = {
					curSchoolID: $scope.userContext.pageContext === 'transferringStaff' ? '0' : $scope.userContext.curSchoolId,
					staffStatus: $scope.userContext.pageContext === 'transferringStaff' ? '1,2' : '1'
				}

				const preload = {
					users: $scope.getJSONData('usersData', usersDataParams)
				}
				if (pageContext === 'transferringStaff' || pageContext === 'newStaff' || pageContext === 'subStaff') {
					preload.schools = $scope.getJSONData('schoolsData')
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
							delete $scope.staffChangeDupeData
							break
						case 'convert':
							$scope.submitPayload[pageContext] = angular.copy($scope.submitPayload[prevContext])
							delete $scope.submitPayload[prevContext]
					}
					$anchorScroll('staff-change-scroll-top')
				})
			}

			$scope.updateScopeFromDropdown = (pageContext, resource, identifier, field) => {
				//if dropdown source is user data
				if (resource === 'usersData') {
					//if the field is the users_dcid find all the fields related to that user and set them in the submit payload
					if (field === 'users_dcid') {
						$scope.submitPayload[pageContext] = { [field]: identifier }
					}
				}
				//if dropdown source is school data
				if (resource === 'schoolsData') {
					//if the drop down is set to -1 aka --Other-- then set the prev_school_name to blank
					if (identifier == -1) {
						$scope.submitPayload[pageContext].prev_school_name = ''
					}
				}
				// if the field being passed in is not null or -1 aka --Other--
				if (identifier && identifier != -1) {
					// find the field in the dataset (resource) passed in
					let foundItem = $scope[resource].find(item => {
						return item.identifier && item.identifier.toString() === identifier.toString()
					})

					if (!foundItem) {
						psAlert({
							title: 'Staff Lookup Error',
							message: 'The selected staff member could not be loaded. Please reselect the staff member before continuing.'
						})
						return
					}
					//if the resource is school data then set the prev_school_name to the school name of the dataset (resource) passed in
					if (resource === 'schoolsData') {
						$scope.submitPayload[pageContext].prev_school_name = foundItem.schoolname
					}
					//if the resource is user data
					if (resource === 'usersData') {
						//and the field is users_dcid
						if (field === 'users_dcid') {
							$scope.submitPayload[pageContext] = angular.extend($scope.submitPayload[pageContext], foundItem)
							removeNullableTitleFields($scope.submitPayload[pageContext])

							if (pageContext === 'nameChange') {
								if ($scope.submitPayload[pageContext].title === 'Fr.' || $scope.submitPayload[pageContext].title === 'Msgr.' || $scope.submitPayload[pageContext].title === 'Sr.' || $scope.submitPayload[pageContext].title === 'Br.') {
									$scope.submitPayload[pageContext].title = ''
								}
								$scope.submitPayload[pageContext].old_name_placeholder = `${!['Fr.', 'Msgr.', 'Sr.', 'Br.'].some(prefix => $scope.submitPayload[pageContext].first_name.startsWith(prefix)) && $scope.submitPayload[pageContext].title ? $scope.submitPayload[pageContext].title + ' ' : ''}${$scope.submitPayload[pageContext].first_name} ${$scope.submitPayload[pageContext].last_name}`
							}
							if (pageContext === 'transferringStaff') {
								$scope.submitPayload[pageContext].prev_school_number = $scope.submitPayload[pageContext].homeschoolid
								$scope.submitPayload[pageContext].prev_school_name = $scope.submitPayload[pageContext].homeschoolname
							}
							if (pageContext === 'newStaff') {
								$scope.submitPayload[pageContext].prev_school_number = $scope.submitPayload[pageContext].homeschoolid
								$scope.submitPayload[pageContext].prev_school_name = $scope.submitPayload[pageContext].homeschoolname
							}
							if (pageContext === 'exitingStaff') {
								$scope.submitPayload[pageContext].old_name_placeholder = `${!['Fr.', 'Msgr.', 'Sr.', 'Br.'].some(prefix => $scope.submitPayload[pageContext].first_name.startsWith(prefix)) && $scope.submitPayload[pageContext].title ? $scope.submitPayload[pageContext].title + ' ' : ''}${$scope.submitPayload[pageContext].first_name} ${$scope.submitPayload[pageContext].last_name}`
							}
						}
						// Dynamically handle both replace_ and canva_ prefixes
						if (field === 'replace_dcid' || field === 'canva_dcid') {
							// Determine the prefix dynamically based on the field
							const prefix = field === 'replace_dcid' ? 'replace_' : 'canva_'
							// Set an empty object
							const dynamicObject = {}

							// Find all the keys in the found item and add the prefix to the front of the key
							// Keep the same value and set those key-value pairs to dynamicObject
							for (let key in foundItem) {
								if (foundItem.hasOwnProperty(key)) {
									if (key.startsWith('$$')) continue
									// Skip license_microsoft if prefix is canva_
									if (prefix === 'canva_' && key === 'license_microsoft') continue
									dynamicObject[`${prefix}${key}`] = foundItem[key]
								}
							}
							// Assign the dynamicObject to the submitPayload
							angular.extend($scope.submitPayload[pageContext], dynamicObject)
							removeNullableTitleFields($scope.submitPayload[pageContext])
						}

						if (pageContext === 'subStaff') {
							$scope.submitPayload[pageContext].license_microsoft = $scope.submitPayload[pageContext].replace_license_microsoft
						}
					}
				}
			}

			$scope.newToTransferringIn = identifier => {
				// Step 1: Copy all properties from newStaff (if it exists)
				const newStaff = $scope.submitPayload.newStaff || {}
				$scope.submitPayload.transferringStaff = angular.copy(newStaff)
				$scope.submitPayload.transferringStaff.users_dcid = identifier

				// Step 2: Find the matching item
				let foundItem = $scope.staffDupeData && $scope.staffDupeData.length && $scope.staffDupeData.find(item => item.identifier === identifier)

				// Step 3: Override only matching keys from foundItem
				if (foundItem) {
					Object.keys(foundItem).forEach(key => {
						$scope.submitPayload.transferringStaff[key] = foundItem[key]
					})
				}

				let specificDeleteKeys = ['identifier', 'ssdcid', 'status', 'email_addr']
				formatService.objIterator($scope.submitPayload.transferringStaff, specificDeleteKeys, 'deleteKeys')
				// Step 4: Remove newStaff
				delete $scope.submitPayload.newStaff
				$scope.userContext.formType = 'transferringStaff'
				$scope.userContext.formTypeHover = 'transferringStaff'
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

			$scope.updateAdditionalPayload = pageContext => {
				if ($scope.submitPayload[pageContext].leaving_radio == 1) {
					$scope.submitPayload.exitingStaff = {}
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
					$scope.submitPayload.jobChange = {}
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
					deadline: normalizeDeadlineForComparison(jitbitPayload.deadline),
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

			const restorePowerSchoolPayload = updateFormatKeys => {
				const originalPayload = copyPayload($scope.originalStaffChangePayloads[$scope.originalChangeType])
				return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'PUT', angular.extend(originalPayload, updateFormatKeys), $scope.userContext.staffChangeId)
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
				if (!dcid || !$scope.usersData) return
				return $scope.usersData.find(user => user.identifier && user.identifier.toString() === dcid.toString())
			}

			$scope.hydrateTransferringStaffName = formPayload => {
				if (formPayload.change_type !== 'transferringStaff' || !formPayload.users_dcid || formPayload.users_dcid == -1 || !isMissingStaffName(formPayload)) {
					return $q.when(true)
				}

				return $scope.getJSONData('usersData', {
					curSchoolID: '0',
					staffStatus: '1,2'
				}).then(() => {
					const foundStaff = findUserDataByDcid(formPayload.users_dcid)
					if (!foundStaff) return false

					;['title', 'first_name', 'last_name', 'license_microsoft', 'staff_status'].forEach(key => {
						formPayload[key] = foundStaff[key]
					})
					removeNullableTitleFields(formPayload)
					formPayload.prev_school_number = formPayload.prev_school_number || foundStaff.homeschoolid
					formPayload.prev_school_name = formPayload.prev_school_name || foundStaff.homeschoolname
					return !isMissingStaffName(formPayload)
				})
			}

			$scope.validateStaffChangePayload = formPayload => {
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

			$scope.createStaffChange = () => {
				loadingDialog()
				const commonPayload = {
					schoolid: $scope.userContext.curSchoolId,
					calendar_year: new Date().getFullYear().toString(),
					submission_date: $scope.userContext.curDate,
					submission_time: $scope.userContext.curTime,
					who_submitted: $scope.userContext.curUserDcid
				}
				let createFormatKeys = angular.copy($scope.formatKeys)
				delete createFormatKeys['checkBoxKeys']
				const payloadKeys = Object.keys($scope.submitPayload)

				const processPayload = key => {
					let formPayload = $scope.submitPayload[key]
					formPayload.change_type = key
					removeNullableTitleFields(formPayload)

					if (!$scope.checkIfBusinessDay(key)) {
						return $q.reject({ handled: true })
					}

					return $scope.validateStaffChangePayload(formPayload).then(isValid => {
						if (!isValid) return $q.reject({ handled: true })

						appendEmergencyReasonToNotes(formPayload, key)

						if (formPayload.change_type == 'exitingStaff') {
							formPayload.old_name_placeholder = `${!['Fr.', 'Msgr.', 'Sr.', 'Br.'].some(prefix => formPayload.first_name.startsWith(prefix)) && formPayload.title ? formPayload.title + ' ' : ''}${formPayload.first_name} ${formPayload.last_name}`
						}
						if (formPayload.change_type == 'subStaff') {
							formPayload.staff_type = '4'
							if (formPayload.sub_type == 'FSTS') {
								formPayload.license_microsoft = 'A1'
							}
							formPayload.position = formPayload.sub_type
						}

						angular.extend(formPayload, commonPayload, createFormatKeys)
						return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'POST', formPayload)
					}).then(staffChangeId => {
						formPayload.staffChangeId = staffChangeId
						if (!$scope.userContext.sendJitbit) return

						let jitbitTicketId
						return jitbitService.createJitbitTicket(buildJitbitPayload(formPayload)).then(ticketId => {
							jitbitTicketId = ticketId
							return jitbitService.updateJitbitTicket({
								id: jitbitTicketId,
								dueDate: formatJitbitDueDate(formPayload.deadline)
							}, { errorStage: 'dueDateUpdate' })
						}).then(() => {
							return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'PUT', { ticket_id: jitbitTicketId }, staffChangeId)
						}).then(() => {
							formPayload.ticket_id = jitbitTicketId
						}).catch(error => {
							return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'DELETE', {}, staffChangeId).then(() => {
								showJitbitSupportError('Jitbit Ticket Error', getCreateJitbitErrorMessage(error), error)
								return $q.reject({ handled: true })
							}, rollbackError => {
								showJitbitSupportError('Manual Cleanup Needed', 'The Jitbit ticket update failed, and the staff change may have been partially saved in PowerSchool.', { error: error, rollbackError: rollbackError })
								return $q.reject({ handled: true })
							})
						})
					})
				}

				return payloadKeys.reduce((promise, key) => {
					return promise.then(() => processPayload(key))
				}, $q.when()).then(() => {
					return $scope.formDisplay('confirm', $scope.userContext.pageContext)
				}).catch(error => {
					if (!error || !error.handled) console.error('Staff change submission failed.', error)
				}).finally(closeLoading)
			}

			$scope.updateStaffChange = form => {
				loadingDialog()
				let updateFormatKeys = angular.copy($scope.formatKeys)
				delete updateFormatKeys['deleteKeys']
				const payloadKeys = Object.keys($scope.submitPayload)

				const processPayload = key => {
					let formPayload = $scope.submitPayload[key]
					formPayload.change_type = key
					removeNullableTitleFields(formPayload)
					const currentJitbitSnapshot = buildJitbitSnapshot(formPayload)
					const shouldSyncJitbitTicket =
						$scope.userContext.pageStatus === 'Edit' &&
						formPayload.ticket_id &&
						hasJitbitSnapshotChanged($scope.originalJitbitSnapshots[$scope.originalChangeType], currentJitbitSnapshot)

					return $scope.validateStaffChangePayload(formPayload).then(isValid => {
						if (!isValid) return $q.reject({ handled: true })

						angular.extend(formPayload, updateFormatKeys)
						const commonCondition = payload => payload.final_completion_date === undefined && payload.ps_created && (payload.ad_created || payload.ad_ignored)
						const o365Condition = payload => payload.o365_created || payload.o365_ignored
						const lmsCondition = payload => payload.lms_created || payload.lms_ignored
						const canvaCondition = payload => payload.canva_created || payload.canva_ignored

						switch (key) {
							case 'newStaff':
							case 'transferringStaff':
								if (commonCondition(formPayload) && o365Condition(formPayload) && lmsCondition(formPayload) && canvaCondition(formPayload)) {
									formPayload.final_completion_date = $scope.userContext.curDate
								} else if (formPayload.final_completion_date) {
									formPayload.final_completion_date = undefined
								}
								break

							case 'nameChange':
								if (formPayload.canva_transfer === '1') {
									if (commonCondition(formPayload) && o365Condition(formPayload) && lmsCondition(formPayload) && canvaCondition(formPayload)) {
										formPayload.final_completion_date = $scope.userContext.curDate
									} else if (formPayload.final_completion_date) {
										formPayload.final_completion_date = undefined
									}
								} else if (commonCondition(formPayload) && o365Condition(formPayload) && lmsCondition(formPayload)) {
									formPayload.final_completion_date = $scope.userContext.curDate
								} else if (formPayload.final_completion_date) {
									formPayload.final_completion_date = undefined
								}
								break

							case 'jobChange':
								if (commonCondition(formPayload)) {
									formPayload.final_completion_date = $scope.userContext.curDate
								} else if (formPayload.final_completion_date) {
									formPayload.final_completion_date = undefined
								}
								break

							case 'exitingStaff':
								if (formPayload.canva_transfer === '1') {
									if (commonCondition(formPayload) && canvaCondition(formPayload)) {
										formPayload.final_completion_date = $scope.userContext.curDate
									} else if (formPayload.final_completion_date) {
										formPayload.final_completion_date = undefined
									}
								} else if (commonCondition(formPayload)) {
									formPayload.final_completion_date = $scope.userContext.curDate
								} else if (formPayload.final_completion_date) {
									formPayload.final_completion_date = undefined
								}
								break

							case 'subStaff':
								if (formPayload.sub_type === 'FSTS') {
									if (formPayload.final_completion_date === undefined && o365Condition(formPayload) && (formPayload.ad_created || formPayload.ad_ignored)) {
										formPayload.final_completion_date = $scope.userContext.curDate
									} else if (formPayload.final_completion_date && !(o365Condition(formPayload) && (formPayload.ad_created || formPayload.ad_ignored))) {
										formPayload.final_completion_date = undefined
									}
								} else if (formPayload.sub_type === 'LTS') {
									if (commonCondition(formPayload) && o365Condition(formPayload) && lmsCondition(formPayload)) {
										formPayload.final_completion_date = $scope.userContext.curDate
									} else if (formPayload.final_completion_date) {
										formPayload.final_completion_date = undefined
									}
								}
								break
						}

						if (!$scope.userContext.staffChangeId) return

						return psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'PUT', formPayload, $scope.userContext.staffChangeId).then(() => {
							if (!shouldSyncJitbitTicket) return

							return jitbitService.syncJitbitTicketFromStaffChange(
								formPayload.ticket_id,
								buildJitbitPayload(formPayload),
								formatJitbitDueDate(formPayload.deadline)
							).catch(error => {
								return restorePowerSchoolPayload(updateFormatKeys).then(() => {
									showJitbitSupportError('Jitbit Ticket Error', getEditJitbitErrorMessage(error), error)
									return $q.reject({ handled: true })
								}, restoreError => {
									showJitbitSupportError('Manual Cleanup Needed', 'The Jitbit ticket update failed, and PowerSchool may not match the Jitbit ticket.', { error: error, restoreError: restoreError })
									return $q.reject({ handled: true })
								})
							})
						})
					})
				}

				return payloadKeys.reduce((promise, key) => {
					return promise.then(() => processPayload(key))
				}, $q.when()).then(() => {
					$scope.toListRedirect(form)
				}).catch(error => {
					if (!error || !error.handled) console.error('Staff change update failed.', error)
				}).finally(closeLoading)
			}

			$scope.deleteStaffChange = form => {
				loadingDialog()
				const deletePromise = $scope.userContext.staffChangeId
					? psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'DELETE', {}, $scope.userContext.staffChangeId).then(() => {
						$scope.toListRedirect(form)
					})
					: $q.when()

				return deletePromise.catch(error => {
					console.error('Staff change deletion failed.', error)
				}).finally(closeLoading)
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

	module.filter('titleCase', function () {
		return function (input) {
			if (!input) return ''
			return (
				input
					// Split by spaces, hyphens, or apostrophes
					.split(/([ \-\–'])/g)
					.map(function (word, index, array) {
						// Capitalize the first letter if it's the first word or follows a delimiter
						if (index === 0 || array[index - 1].match(/[ \-\–']/)) {
							return word.charAt(0).toUpperCase() + word.slice(1)
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
