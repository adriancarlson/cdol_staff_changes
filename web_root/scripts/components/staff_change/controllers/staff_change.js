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
			let psDialogHolder = null

			$scope.openDupeDialog = function () {
				psDialogHolder = $j('#dupeDiv').detach()
				psDialog({
					type: 'dialogM',
					width: 1000,
					title: 'Potential Duplicate Staff Change Found!',
					content: psDialogHolder,
					initBehaviors: true,
					close: function () {
						showMessage('dialog close event hi')
						delete $scope.staffChangeDupeData
						// Move View back to a holder so that it won't be lost if another type of dialog is opened.
						$j('#dialogContainer').append(psDialogHolder)
					},
					buttons: [
						{
							id: 'saveDialogButton',
							text: 'Proceed',
							title: 'Proceed',
							click: function () {
								showMessage('save was clicked')
								delete $scope.staffChangeDupeData
								psDialogClose()
							}
						}
					]
				})
			}

			$scope.closeDupeDialog = function (formType, pageContext) {
				console.log('running', formType, pageContext)
				delete $scope.staffChangeDupeData
				$j('#dialogContainer').append(psDialogHolder)
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

			var showMessage = function (message) {
				console.log(message)
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
				prevContext: undefined
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
				new Date(`01/04/${curYear}`), // Christmas Break
				new Date(`03/28/${curYear}`), // Holy Thursday
				new Date(`03/29/${curYear}`), // Good Friday
				new Date(`04/01/${curYear}`), // Easter
				new Date(`04/02/${curYear}`), // Easter Monday
				new Date(`05/09/${curYear}`), // Ascension Day
				new Date(`05/27/${curYear}`), // Memorial Day
				new Date(`07/01/${curYear}`), // PowerSchool Roll Over
				new Date(`07/04/${curYear}`), // Independence Day
				new Date(`07/05/${curYear}`), // Independence Day Break
				new Date(`08/02/${curYear}`), // Incoperation Day
				new Date(`08/15/${curYear}`), // Assumption of Mary
				new Date(`09/02/${curYear}`), // Labor Day
				new Date(`11/01/${curYear}`), // All Saints' Day
				new Date(`11/27/${curYear}`), // Thanksgiving Break
				new Date(`11/28/${curYear}`), // Thanksgiving Break
				new Date(`11/29/${curYear}`), // Thanksgiving Break
				new Date(`12/09/${curYear}`), // Immaculate Conception
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

			// setting up universal formatKeys that will be used in API calls to format fields or delete feidls
			$scope.formatKeys = {
				dateKeys: ['_date', 'dob', 'deadline'],
				checkBoxKeys: ['_created', '_ignored'],
				deleteKeys: ['_radio', 'homeschool', 'identifier']
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
					if ($scope.userContext.pageContext === 'newStaff') {
						await $scope.searchForDups(res)
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
						url: `/admin/staff_change/data/${resource}.json`,
						method: 'GET',
						params: params
					})
					$scope[resource] = res.data
					$scope[resource].pop()
					$scope.$apply()
				}
			}

			$scope.searchForDups = async staffToSearch => {
				let staffDupParams = {
					lastName: staffToSearch.last_name.toLowerCase(),
					maidenName: `${staffToSearch.middle_name ? staffToSearch.middle_name.toLowerCase() : null}`,
					firstNameSubString: staffToSearch.first_name.substring(0, 3).toLowerCase()
				}
				$scope.getJSONData('staffDupData', staffDupParams)
			}

			$scope.dupSearch = async (pageContext, formPayload) => {
				console.log(pageContext)
				let staffChangeDupParams = {
					calendarYear: new Date().getFullYear().toString(),
					firstName: formPayload.replace_first_name ? formPayload.replace_first_name : formPayload.first_name,
					lastName: formPayload.replace_first_name ? formPayload.replace_last_name : formPayload.last_name,
					curSchoolID: formPayload.replace_first_name ? formPayload.replace_homeschoolid : $scope.userContext.curSchoolId,
					changeType: 'allStaff'
				}
				await $scope.getJSONData('staffChangeDupeData', staffChangeDupParams)

				// Conditional filtering
				if (pageContext === 'newStaff' || pageContext === 'transferringStaff') {
					$scope.staffChangeDupeData = $scope.staffChangeDupeData.filter(item => item.change_type === 'newStaff' || item.change_type === 'transferringStaff')
				} else {
					$scope.staffChangeDupeData = $scope.staffChangeDupeData.filter(item => item.change_type === pageContext)
				}

				$scope.$apply()

				if ($scope.staffChangeDupeData.length > 0) {
					$scope.openDupeDialog()
				}
			}
			// function to switch forms and set scope to hold form data
			$scope.formDisplay = (pageContext, prevContext, direction) => {
				$scope.userContext.pageContext = pageContext
				$scope.userContext.prevContext = prevContext
				//load user data now needed on all forms
				$scope.getJSONData('usersData')

				//only loading school data if it is needed
				if (pageContext === 'transferringStaff' || pageContext === 'newStaff') {
					$scope.getJSONData('schoolsData')
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
				}
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
						//if the resource is user data and the field is replace_dcid
						if (field === 'replace_dcid') {
							// set and empty object
							const replaceObject = {}
							// find all the keys in the found item and add the 'replace_' to the front of the key. keep same value. then set those key value pairs to replaceObject
							for (let key in foundItem) {
								if (foundItem.hasOwnProperty(key)) {
									replaceObject[`replace_${key}`] = foundItem[key]
								}
							}
							// assign the replaceObject to the submitPayload
							Object.assign($scope.submitPayload[pageContext], replaceObject)
						}
					}
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

					//add commonPayload to each object in submitPayload
					formPayload = Object.assign(formPayload, commonPayload)
					//add createFormatKeys to each object in submitPayload
					formPayload = Object.assign(formPayload, createFormatKeys)
					//submitting staff changes through api
					let staffChangeId = await psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'POST', formPayload)

					let jitbitPayload = {
						...formPayload,
						curUserName: $scope.userContext.curUserName,
						curUserSchoolAbbr: $scope.userContext.curUserSchoolAbbr,
						curDate: $scope.userContext.curDate,
						curTime: $scope.userContext.curTime,
						userEmail: $scope.userContext.curUserEmail,
						readableChangeType: formatService.changeMap(formPayload.change_type)
					}

					// 	let jitbitTicketId = await jitbitService.createJitbitTicket(jitbitPayload)

					// 	await psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'PUT', { ticket_id: jitbitTicketId }, staffChangeId)

					let formattedDate = formatService.formatDateForApi(formPayload.deadline)
					let concatenatedDateTime = `${formattedDate}T23:59:00Z`

					// 	await jitbitService.updateJitbitTicket({ id: jitbitTicketId, dueDate: concatenatedDateTime })

					formPayload.staffChangeId = staffChangeId
					// 	formPayload.ticket_id = jitbitTicketId
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

					if (key !== 'exitingStaff' && key !== 'jobChange') {
						if (formPayload.final_completion_date === undefined && formPayload.ps_created && (formPayload.ad_created || formPayload.ad_ignored) && (formPayload.o365_created || formPayload.o365_ignored) && formPayload.lms_created) {
							formPayload.final_completion_date = $scope.userContext.curDate
						}
					} else {
						if (formPayload.final_completion_date === undefined && formPayload.ps_created && (formPayload.ad_created || formPayload.ad_ignored)) {
							formPayload.final_completion_date = $scope.userContext.curDate
						}
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
					case 'transferringStaff':
						redirectPath = `${redirectPath}#tabTwoContent`
						break
					case 'jobChange':
						redirectPath = `${redirectPath}#tabThreeContent`
						break
					case 'nameChange':
						redirectPath = `${redirectPath}#tabFourContent`
						break
					case 'exitingStaff':
						redirectPath = `${redirectPath}#tabFiveContent`
						break
					case 'allStaff':
						redirectPath = `${redirectPath}#tabSixContent`
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
			return input
				.toLowerCase()
				.split(' ')
				.map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
				.join(' ')
				.trim()
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
})
