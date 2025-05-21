'use strict'
define(function (require) {
	var module = require('components/staff_change/module')

	module.controller('staffChangeCtrl', [
		'$scope',
		'$http',
		'$attrs',
		'$window',
		'$anchorScroll',
		'$location',
		'pqService',
		'formatService',
		'psApiService',
		'jitbitService',
		function ($scope, $http, $attrs, $window, $anchorScroll, $location, pqService, formatService, psApiService, jitbitService) {
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
				pageContext: 'start',
				prevContext: undefined,
				serverName: $attrs.ngServerName,
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

			$scope.holidays = [
				new Date(`01/01/${curYear}`), // New Year's Day
				new Date(`01/02/${curYear}`), // Christmas Break
				new Date(`01/03/${curYear}`), // Christmas Break
				new Date(`01/20/${curYear}`), // MLK Jr. Day
				new Date(`04/17/${curYear}`), // Holy Thursday
				new Date(`04/18/${curYear}`), // Good Friday
				new Date(`04/19/${curYear}`), // Saturday
				new Date(`04/20/${curYear}`), // Easter
				new Date(`04/21/${curYear}`), // Easter Monday
				new Date(`04/22/${curYear}`), // Easter Tuesday
				new Date(`05/26/${curYear}`), // Memorial Day
				new Date(`05/29/${curYear}`), // Ascension Day
				new Date(`07/01/${curYear}`), // PowerSchool Roll Over
				new Date(`07/04/${curYear}`), // Independence Day
				new Date(`08/15/${curYear}`), // Assumption of Mary
				new Date(`09/01/${curYear}`), // Labor Day
				new Date(`11/01/${curYear}`), // All Saints' Day
				new Date(`11/26/${curYear}`), // Thanksgiving Break
				new Date(`11/27/${curYear}`), // Thanksgiving Break
				new Date(`11/28/${curYear}`), // Thanksgiving Break
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

			if (today >= firstDay && today < lastDay) {
				$scope.userContext.tempDeadline = formatDate(lastDay)
			} else {
				$scope.userContext.tempDeadline = $scope.userContext.minDate
			}

			$scope.checkIfBusinessDay = pageContext => {
				const checkDate = new Date($scope.submitPayload[pageContext].deadline)

				// Function to check if a date is a business day
				const isBusinessDay = date => {
					// Check if it's a weekend
					if (date.getDay() === 0 || date.getDay() === 6) {
						return false
					}
					// Check if it's a holiday
					if ($scope.holidays.some(holiday => holiday.getTime() === date.getTime())) {
						return false
					}
					return true
				}

				// Check if the checkDate is a business day
				$scope.userContext.invalidDate = !isBusinessDay(checkDate)
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

			//pull exiting Staff Change Record and setting it to submitPayload if an staffChangeId was provided through URL Params
			$scope.getStaffChange = async staffChangeId => {
				loadingDialog()
				//copyFormatKeys
				let getFormatKeys = await { ...$scope.formatKeys }
				delete getFormatKeys['deleteKeys']

				if (staffChangeId) {
					const res = await psApiService.psApiCall(`U_CDOL_STAFF_CHANGES`, `GET`, getFormatKeys, staffChangeId)
					$scope.submitPayload[res.change_type] = await res
					$scope.userContext.pageContext = await res.change_type

					if ($scope.userContext.pageContext === 'newStaff' || $scope.userContext.pageContext === 'subStaff') {
						await $scope.checkDupesOnEdit(res)
					}
				}

				$scope.$digest()
				closeLoading()
			}
			//check if staffChangeId was provided through URL Params and then run getStaffChange function with that staffChangeId
			if ($scope.userContext.staffChangeId) {
				$scope.getStaffChange($scope.userContext.staffChangeId)
			}
			//had to switch from PQ's to pulling this data through t_list SQL and JSON files because of PowerSchools Data Restriction Framework on PQs
			$scope.getJSONData = async (resource, params = {}) => {
				if (!$scope[resource]) {
					const res = await $http({
						url: `/admin/staff_change/json/${resource}.json`,
						method: 'GET',
						params: params
					})
					$scope[resource] = res.data || []
					// Convert all numeric values in each object to stringsl
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
					$scope.$applyAsync()
				}
			}

			$scope.checkDupesOnEdit = async staffToSearch => {
				let staffDupeParams = {
					firstName: staffToSearch.first_name,
					lastName: staffToSearch.last_name,
					...(staffToSearch.maiden_name && { maidenName: staffToSearch.maiden_name })
				}

				await $scope.getJSONData('staffDupeData', staffDupeParams)
			}

			$scope.dupeSearch = async (pageContext, formPayload, searchType) => {
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

				await $scope.getJSONData('staffChangeDupeData', staffChangeDupeParams)

				// Conditional filtering
				if (pageContext === 'newStaff' || pageContext === 'transferringStaff' || pageContext === 'subStaff') {
					$scope.staffChangeDupeData = $scope.staffChangeDupeData.filter(item => item.change_type === 'newStaff' || item.change_type === 'transferringStaff' || item.change_type === 'subStaff')
				} else {
					$scope.staffChangeDupeData = $scope.staffChangeDupeData.filter(item => item.change_type === pageContext)
				}

				if ($scope.staffChangeDupeData.length > 0) {
					$scope.openDialog('staffChangeDupe')
				} else if (pageContext === 'newStaff') {
					if ($scope.staffDupeData) {
						delete $scope.staffDupeData
					}

					let staffDupeParams = {
						firstName: formPayload.first_name,
						lastName: formPayload.last_name,
						...(formPayload.maiden_name && { maidenName: formPayload.maiden_name })
					}

					await $scope.getJSONData('staffDupeData', staffDupeParams)

					if ($scope.staffDupeData.length > 0) {
						$scope.openDialog('staffDupe')
					}
				}
			}
			// function to switch forms and set scope to hold form data
			$scope.formDisplay = async (pageContext, prevContext, direction) => {
				$scope.userContext.pageContext = pageContext
				$scope.userContext.prevContext = prevContext
				//load user data now needed on all forms
				await $scope.getJSONData('usersData')

				//only loading school data if it is needed
				if (pageContext === 'transferringStaff' || pageContext === 'newStaff' || pageContext === 'subStaff') {
					await $scope.getJSONData('schoolsData')
				}
				//add and remove form payload objects based on directions of buttons
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
						$scope.submitPayload[pageContext] = { ...$scope.submitPayload[prevContext] }
						delete $scope.submitPayload[prevContext]
				}
				$scope.$applyAsync()
				//adding scroll to top when switching between forms
				// had to change from $window.scrollTo(0, 0) because it broke in the enhanced UI
				$anchorScroll('staff-change-scroll-top')
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
						return item.identifier === identifier
					})
					//if the resource is school data then set the prev_school_name to the school name of the dataset (resource) passed in
					if (resource === 'schoolsData') {
						$scope.submitPayload[pageContext].prev_school_name = foundItem.schoolname
					}
					//if the resource is user data
					if (resource === 'usersData') {
						//and the field is users_dcid
						if (field === 'users_dcid') {
							$scope.submitPayload[pageContext] = Object.assign($scope.submitPayload[pageContext], foundItem)

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
									// Skip license_microsoft if prefix is canva_
									if (prefix === 'canva_' && key === 'license_microsoft') continue
									dynamicObject[`${prefix}${key}`] = foundItem[key]
								}
							}
							// Assign the dynamicObject to the submitPayload
							Object.assign($scope.submitPayload[pageContext], dynamicObject)
						}

						if (pageContext === 'subStaff') {
							$scope.submitPayload[pageContext].license_microsoft = $scope.submitPayload[pageContext].replace_license_microsoft
						}
					}
				}
			}

			$scope.newToTransferringIn = identifier => {
				delete $scope.submitPayload.newStaff

				$scope.submitPayload.transferringStaff = { users_dcid: identifier }

				let foundItem = ($scope.usersData && $scope.usersData.length && $scope.usersData.find(item => item.identifier === identifier)) || ($scope.staffDupeData && $scope.staffDupeData.length && $scope.staffDupeData.find(item => item.identifier === identifier))
				
				$scope.submitPayload.transferringStaff = Object.assign($scope.submitPayload.transferringStaff, foundItem)
				$scope.submitPayload.transferringStaff.prev_school_number = $scope.submitPayload.transferringStaff.homeschoolid
				$scope.submitPayload.transferringStaff.prev_school_name = $scope.submitPayload.transferringStaff.homeschoolname
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

			$scope.createStaffChange = async () => {
				//adding generic fields and values needed for any payload
				const commonPayload = {
					schoolid: $scope.userContext.curSchoolId,
					calendar_year: new Date().getFullYear().toString(),
					submission_date: $scope.userContext.curDate,
					submission_time: $scope.userContext.curTime,
					who_submitted: $scope.userContext.curUserDcid
				}
				// copy formatKeys
				let createFormatKeys = { ...$scope.formatKeys }
				// delete formatKeys key that is not needed for POST API Call
				delete createFormatKeys['checkBoxKeys']
				//loop though submitPayload object
				Object.keys($scope.submitPayload).forEach(async (key, index) => {
					let formPayload = $scope.submitPayload[key]
					formPayload.change_type = key

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

					//add commonPayload to each object in submitPayload
					formPayload = Object.assign(formPayload, commonPayload)
					//add createFormatKeys to each object in submitPayload
					formPayload = Object.assign(formPayload, createFormatKeys)
					//submitting staff changes through api
					let staffChangeId = await psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'POST', formPayload)

					// only create a Jitbit ticket if the form is not a test server
					if ($scope.userContext.sendJitbit) {
						let jitbitPayload = {
							...formPayload,
							curUserName: $scope.userContext.curUserName,
							curUserSchoolAbbr: $scope.userContext.curUserSchoolAbbr,
							curDate: $scope.userContext.curDate,
							curTime: $scope.userContext.curTime,
							userEmail: $scope.userContext.curUserEmail,
							readableChangeType: formPayload.change_type === 'subStaff' ? `${formatService.changeMap(formPayload.change_type)} (${formPayload.sub_type})` : `${formatService.changeMap(formPayload.change_type)}`
						}

						let jitbitTicketId = await jitbitService.createJitbitTicket(jitbitPayload)

						await psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'PUT', { ticket_id: jitbitTicketId }, staffChangeId)

						let formattedDate = formatService.formatDateForApi(formPayload.deadline)
						let concatenatedDateTime = `${formattedDate}T23:59:00Z`

						await jitbitService.updateJitbitTicket({ id: jitbitTicketId, dueDate: concatenatedDateTime })

						formPayload.ticket_id = jitbitTicketId
					}

					formPayload.staffChangeId = staffChangeId
				})
				//sending to confirm screen after submission
				$scope.formDisplay('confirm', $scope.userContext.pageContext)
			}

			$scope.updateStaffChange = async form => {
				// copy formatKeys
				let updateFormatKeys = { ...$scope.formatKeys }
				//delete updateFormatKeys key not needed for PUT API Call
				delete updateFormatKeys['deleteKeys']

				Object.keys($scope.submitPayload).forEach(async (key, index) => {
					let formPayload = $scope.submitPayload[key]
					formPayload.change_type = key

					//add updateFormatKeys to each object in submitPayload
					formPayload = Object.assign(formPayload, updateFormatKeys)

					//updating final completion date based on conditions (condensed from numerous if statements by chatGPT)
					const commonCondition = formPayload => formPayload.final_completion_date === undefined && formPayload.ps_created && (formPayload.ad_created || formPayload.ad_ignored)

					const o365Condition = formPayload => formPayload.o365_created || formPayload.o365_ignored

					const lmsCondition = formPayload => formPayload.lms_created

					const canvaCondition = formPayload => formPayload.canva_created

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
							} else {
								if (commonCondition(formPayload) && o365Condition(formPayload) && lmsCondition(formPayload)) {
									formPayload.final_completion_date = $scope.userContext.curDate
								} else if (formPayload.final_completion_date) {
									formPayload.final_completion_date = undefined
								}
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
							} else {
								if (commonCondition(formPayload)) {
									formPayload.final_completion_date = $scope.userContext.curDate
								} else if (formPayload.final_completion_date) {
									formPayload.final_completion_date = undefined
								}
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

					if ($scope.userContext.staffChangeId) {
						await psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'PUT', formPayload, $scope.userContext.staffChangeId)
						$scope.toListRedirect(form)
					}
				})
			}
			$scope.deleteStaffChange = async form => {
				if ($scope.userContext.staffChangeId) {
					await psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'DELETE', {}, $scope.userContext.staffChangeId)
					await $scope.toListRedirect(form)
				}
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

	module.filter('schoolName', function () {
		const map = {
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
