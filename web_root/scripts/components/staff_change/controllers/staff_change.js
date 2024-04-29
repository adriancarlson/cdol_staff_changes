'use strict'
define(function (require) {
	var module = require('components/staff_change/module')

	module.controller('staffChangeCtrl', [
		'$scope',
		'$http',
		'$attrs',
		'$window',
		'formatService',
		'psApiService',
		'jitbitService',
		function ($scope, $http, $attrs, $window, formatService, psApiService, jitbitService) {
			//initializing overall form data
			$scope.userContext = {
				pageStatus: $attrs.ngStatus,
				curSchoolId: $attrs.ngCurSchoolId,
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
			// setting up universal formatKeys that will be used in API calls to format fields or delete feidls
			$scope.formatKeys = {
				dateKeys: ['_date', 'dob', 'deadline'],
				checkBoxKeys: ['_created', '_ignored'],
				deleteKeys: ['_radio', 'homeschool', 'identifier']
			}
			//initilazing empty payload
			$scope.submitPayload = {}
			// determining if today between Jan 1st and July 1st
			$scope.todayBeforeJuly = () => {
				const curYear = new Date().getFullYear()
				const firstDay = new Date(`01/01/${curYear}`)
				const lastDay = new Date(`06/30/${curYear}`)
				const today = new Date()
				$scope.userContext.isTodayBeforeJuly = today >= firstDay && today < lastDay
			}
			$scope.todayBeforeJuly()

			//pull existing Staff Change Record and setting it to submitPayload if an staffChangeId was provided through URL Params
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
						break
				}
				//adding scroll to top when switching between forms
				$window.scrollTo(0, 0)
			}

			// $scope.updateLicensing = pageContext => {
			// 	if (!$scope.submitPayload[pageContext].hasOwnProperty('license_microsoft')) {
			// 		$scope.submitPayload[pageContext].license_microsoft = 'A1'
			// 	}

			// 	if (!$scope.submitPayload[pageContext].hasOwnProperty('license_adobe')) {
			// 		$scope.submitPayload[pageContext].license_adobe = 'No'
			// 	}
			// }

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
								$scope.submitPayload[pageContext].old_name_placeholder = `${$scope.submitPayload[pageContext].title} ${$scope.submitPayload[pageContext].first_name} ${$scope.submitPayload[pageContext].last_name}`
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
								$scope.submitPayload[pageContext].old_name_placeholder = `${$scope.submitPayload[pageContext].title} ${$scope.submitPayload[pageContext].first_name} ${$scope.submitPayload[pageContext].last_name}`
							}
						}
						//if the resource is user data and the field is replace_dcid
						if (field === 'replace_dcid') {
							// set and empty object
							const replaceObject = {}
							// find all the keys in the found item and add the 'replace_' to the front of the key. keep same value. then set those key value pairs to replaceObject
							for (key in foundItem) {
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
						formPayload.old_name_placeholder = `${formPayload.title} ${formPayload.first_name} ${formPayload.last_name}`
					}

					// constructing deadline
					if (formPayload.hasOwnProperty('date_radio')) {
						const today = new Date()
						const yyyy = today.getFullYear()
						let mm = today.getMonth() + 1 // Months start at 0!
						let dd = today.getDate()
						if (dd < 10) dd = '0' + dd
						if (mm < 10) mm = '0' + mm
						let todayFormated = mm + '/' + dd + '/' + yyyy

						if (formPayload.date_radio === 'today') {
							formPayload.deadline = todayFormated
						} else if (formPayload.date_radio === 'june30') {
							formPayload.deadline = `06/30/${yyyy}`
						}
					}

					//add commonPayload to each object in submitPayload
					formPayload = Object.assign(formPayload, commonPayload)
					//add createFormatKeys to each object in submitPayload
					formPayload = Object.assign(formPayload, createFormatKeys)
					//submitting staff changes through api
					await psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'POST', formPayload)

					//jitbit call here
					let jitbitPayload = {
						...formPayload,
						curUserName: $scope.userContext.curUserName,
						curUserSchoolAbbr: $scope.userContext.curUserSchoolAbbr,
						curDate: $scope.userContext.curDate,
						curTime: $scope.userContext.curTime,
						userEmail: $scope.userContext.curUserEmail,
						readableChangeType: formatService.decamelize(formPayload.change_type)
					}

					jitbitPayload = await jitbitService.createJitbitTicket(jitbitPayload)
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
})
