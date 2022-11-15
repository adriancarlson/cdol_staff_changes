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
			console.log('dierction', direction)
			console.log('pageContext', pageContext)
			console.log('prevContext', prevContext)

			//only loading User data or school data if it is needed
			if (pageContext !== 'newStaff') {
				$scope.getJSONData('usersData')
			}
			if (pageContext === 'transferringStaff') {
				$scope.getJSONData('schoolsData')
			}

			if (pageContext === 'confirm') {
				$scope.submitPayload = {}
			}

			if (direction === 'reset' || direction === 'back') {
				if ($scope.userContext.pageContext !== $scope.userContext.prevContext) {
					delete $scope.submitPayload[prevContext]
				}
			}

			//     			// resetting payload if user hit the back button and started a new submission type
			//     			if (
			//     				$scope.userContext.prevContext !== undefined &&
			//     				$scope.userContext.pageContext !== 'start' &&
			//     				$scope.userContext.pageContext !== 'confirm' &&
			//     				$scope.userContext.pageContext !== $scope.userContext.prevContext
			//     			) {
			//     			    console.log('I ran');
			//     				delete $scope.submitPayload[prevContext]
			//     			}
			// 			}
		}
		//this function is used on any dropdown. It updates many fields on the scope each time dropdown changes based on where it is called. Alot of conditional logic
		//passing in the page context= which form, the resource=name of JSON file, identifier =usually field on scope that needs updated, field =name of filed (used for conditional logic in function)
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
							$scope.submitPayload[
								pageContext
							].old_name_placeholder = `${$scope.submitPayload[pageContext].title} ${$scope.submitPayload[pageContext].first_name} ${$scope.submitPayload[pageContext].last_name}`
						}
						if (pageContext === 'transferringStaff') {
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
				change_type: $scope.userContext.pageContext,
				submission_date: dateService.formatDateForApi($scope.userContext.curDate),
				submission_time: $scope.userContext.curTime,
				who_submitted: $scope.userContext.curUserId
			}
			//loop though submitPayload object
			Object.keys($scope.submitPayload).forEach(async (key, index) => {
				let formPayload = $scope.submitPayload[key]
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
})
