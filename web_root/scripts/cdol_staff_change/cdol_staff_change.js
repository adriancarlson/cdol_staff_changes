define([
	'angular',
	'components/shared/index',
	'/scripts/cdol/services/dateService.js',
	'/scripts/cdol/services/checkboxService.js',
	'/scripts/cdol/services/camelService.js',
	'/scripts/cdol/services/pqService.js',
	'/scripts/cdol/services/psApiService.js'
], function (angular) {
	var cdolStaffApp = angular.module('cdolStaffAppMod', ['powerSchoolModule', 'dateService', 'checkboxModule', 'camelModule', 'pqModule', 'psApiModule'])
	cdolStaffApp.controller('cdolStaffAppCtrl', function ($scope, $http, $attrs, $q, $window, dateService, checkboxService, camelService, pqService, psApiService) {
		//initializing overall form data
		$scope.userContext = {
			pageStatus: $attrs.ngStatus,
			curSchoolId: $attrs.ngCurSchoolId,
			curYearId: $attrs.ngCurYearId,
			curDate: $attrs.ngCurDate,
			curTime: $attrs.ngCurTime,
			staffChangeId: $attrs.ngStaffChangeId,
			curUserId: $attrs.ngCurUserId,
			curStaffId: $attrs.ngCurUserId,
			curUserName: $attrs.ngCurUserName,
			curUserEmail: $attrs.ngCurUserEmail,
			curUserSchoolAbbr: $attrs.ngCurUserSchoolAbbr,
			pageContext: 'start',
			prevContext: undefined
		}
		//initilazing empty payload
		$scope.submitPayload = {}
		// determining if today between Jan 1st and July 1st
		const todayBeforeJuly = () => {
			const curYear = new Date().getFullYear()
			const firstDay = new Date(`01/01/${curYear}`)
			const lastDay = new Date(`06/30/${curYear}`)
			const today = new Date()
			$scope.userContext.isTodayBeforeJuly = today >= firstDay && today < lastDay
		}
		todayBeforeJuly()
		//had to switch from PQ's to pulling this data through t_list SQL and JSON files because of PowerSchools Data Restriction Framework on PQs
		$scope.getJSONData = async resource => {
			if (!$scope[resource]) {
				const res = await $http({
					url: `/admin/cdol/staff_change/data/${resource}.json`,
					method: 'GET'
				})
				$scope[resource] = res.data
				$scope[resource].pop()
			}
		}

		// function to switch forms and set scope to hold form data
		$scope.formDipslay = (pageContext, prevContext, direction) => {
			$scope.userContext.pageContext = pageContext
			$scope.userContext.prevContext = prevContext
			// console.log('direction', direction)
			// console.log('pageContext', pageContext)
			// console.log('prevContext', prevContext)

			//load user data
			$scope.getJSONData('usersData')

			//only loading school data if it is needed
			if (pageContext === 'transferringStaff' || pageContext === 'newStaff') {
				$scope.getJSONData('schoolsData')
			}
			//clearing payload after submission
			if (pageContext === 'confirm') {
				$scope.submitPayload = {}
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
			$window.scrollTo(0, 0)
		}

		$scope.updateScopeFromDropdown = (pageContext, resource, identifier, field) => {
			if (resource === 'usersData') {
				if (field === 'users_dcid') {
					$scope.submitPayload[pageContext] = { [field]: identifier }
				}
			}

			if (resource === 'schoolsData') {
				if (identifier == -1) {
					$scope.submitPayload[pageContext].prev_school_name = ''
				}
			}

			if (identifier && identifier != -1) {
				let foundItem = $scope[resource].find(item => {
					return item.identifier === identifier
				})

				if (resource === 'schoolsData') {
					$scope.submitPayload[pageContext].prev_school_name = foundItem.schoolname
				}

				if (resource === 'usersData') {
					if (field === 'users_dcid') {
						$scope.submitPayload[pageContext] = Object.assign($scope.submitPayload[pageContext], foundItem)

						if (pageContext === 'nameChange') {
							if (
								$scope.submitPayload[pageContext].title === 'Fr.' ||
								$scope.submitPayload[pageContext].title === 'Msgr.' ||
								$scope.submitPayload[pageContext].title === 'Sr.' ||
								$scope.submitPayload[pageContext].title === 'Br.'
							) {
								$scope.submitPayload[pageContext].title = ''
							}
							$scope.submitPayload[
								pageContext
							].old_name_placeholder = `${$scope.submitPayload[pageContext].title} ${$scope.submitPayload[pageContext].first_name} ${$scope.submitPayload[pageContext].last_name}`
						}
						if (pageContext === 'transferringStaff') {
							$scope.submitPayload[pageContext].prev_school_number = $scope.submitPayload[pageContext].homeschoolid
							$scope.submitPayload[pageContext].prev_school_name = $scope.submitPayload[pageContext].homeschoolname
						}
						if (pageContext === 'newStaff') {
							$scope.submitPayload[pageContext].prev_school_number = $scope.submitPayload[pageContext].homeschoolid
							$scope.submitPayload[pageContext].prev_school_name = $scope.submitPayload[pageContext].homeschoolname
						}
					}

					if (field === 'replace_dcid') {
						const replaceObject = {}
						for (key in foundItem) {
							if (foundItem.hasOwnProperty(key)) {
								replaceObject[`replace_${key}`] = foundItem[key]
							}
						}
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
		}

		$scope.submitStaffChange = async () => {
			//adding generic fields and values needed for any payload
			const commonPayload = {
				schoolid: $scope.userContext.curSchoolId,
				calendar_year: new Date().getFullYear().toString(),
				submission_date: dateService.formatDateForApi($scope.userContext.curDate),
				submission_time: $scope.userContext.curTime,
				who_submitted: $scope.userContext.curUserId
			}
			//loop though submitPayload object
			Object.keys($scope.submitPayload).forEach(async (key, index) => {
				let formPayload = $scope.submitPayload[key]
				formPayload.change_type = key
				//add commonPayload to each object in submitPayload
				formPayload = Object.assign(formPayload, commonPayload)
				// constructing deadline
				if (formPayload.hasOwnProperty('date_radio')) {
					const today = new Date()
					const yyyy = today.getFullYear()
					let mm = today.getMonth() + 1 // Months start at 0!
					let dd = today.getDate()
					if (dd < 10) dd = '0' + dd
					if (mm < 10) mm = '0' + mm
					todayFormated = mm + '/' + dd + '/' + yyyy

					if (formPayload.date_radio === 'today') {
						formPayload.deadline = todayFormated
					} else if (formPayload.date_radio === 'june30') {
						formPayload.deadline = `06/30/${yyyy}`
					}
				}
				// copying formPayload using spread. Then deleting any unneeded key value pairs before sending to API call
				apiPayload = { ...formPayload }
				// get all date fields ready for API call
				apiPayload.deadline = dateService.formatDateForApi(apiPayload.deadline)
				apiPayload.dob = dateService.formatDateForApi(apiPayload.dob)
				//applying case formatting to text entry fields
				if (apiPayload.first_name) {
					apiPayload.first_name = camelService.camelize(apiPayload.first_name)
				}
				if (apiPayload.middle_name) {
					apiPayload.middle_name = camelService.camelize(apiPayload.middle_name)
				}
				if (apiPayload.last_name) {
					apiPayload.last_name = camelService.camelize(apiPayload.last_name)
				}
				if (apiPayload.preferred_name) {
					apiPayload.preferred_name = camelService.camelize(apiPayload.preferred_name)
				}
				if (apiPayload.maiden_name) {
					apiPayload.maiden_name = camelService.camelize(apiPayload.maiden_name)
				}
				if (apiPayload.position) {
					apiPayload.position = camelService.camelize(apiPayload.position)
				}
				if (apiPayload.notes) {
					apiPayload.notes = camelService.sentenceCase(apiPayload.notes)
				}
				if (apiPayload.old_name_placeholder) {
					apiPayload.old_name_placeholder = camelService.camelize(apiPayload.old_name_placeholder)
				}
				if (apiPayload.previous_position) {
					apiPayload.previous_position = camelService.sentenceCase(apiPayload.previous_position)
				}
				if (apiPayload.new_position) {
					apiPayload.new_position = camelService.sentenceCase(apiPayload.new_position)
				}
				if (apiPayload.prev_school_name) {
					apiPayload.prev_school_name = camelService.camelize(apiPayload.prev_school_name)
				}
				if (apiPayload.replace_first_name) {
					apiPayload.replace_first_name = camelService.camelize(apiPayload.replace_first_name)
				}
				if (apiPayload.replace_middle_name) {
					apiPayload.replace_middle_name = camelService.camelize(apiPayload.replace_middle_name)
				}
				if (apiPayload.replace_last_name) {
					apiPayload.replace_last_name = camelService.camelize(apiPayload.replace_last_name)
				}
				// removing items from the object not needed for the submission Record
				const keysToDelete = ['_radio', 'homeschool', 'identifier']
				// get all the keys from the apiPayload object
				const getApiPayloadKeys = Object.keys(apiPayload)
				keysToDelete.forEach(item => {
					// looping through first object
					getApiPayloadKeys.forEach(keyName => {
						// using index of to check if the object key name have a matched string if so deleting it from the payload
						if (keyName.indexOf(item) !== -1) {
							delete apiPayload[keyName]
						}
					})
				})
				//submitting staff changes through api
				await psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'POST', apiPayload)
			})
			//sending to confirm screen after submission
			$scope.formDipslay('confirm', $scope.userContext.pageContext)
		}
	})
	//directives for each form
	cdolStaffApp.directive('start', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/start.html' }))
	cdolStaffApp.directive('newStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/new_staff.html' }))
	cdolStaffApp.directive('transferStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/transfer_staff.html' }))
	cdolStaffApp.directive('jobChange', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/job_change.html' }))
	cdolStaffApp.directive('nameChange', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/name_change.html' }))
	cdolStaffApp.directive('exitStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/exit_staff.html' }))
	cdolStaffApp.directive('confirm', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/confirm.html' }))
	cdolStaffApp.directive('tests', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tests.html' }))
})
