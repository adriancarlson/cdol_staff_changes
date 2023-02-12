define(['angular', 'components/shared/index', '/scripts/cdol/services/formatService.js', '/scripts/cdol/services/psApiService.js'], function (angular) {
	var cdolStaffApp = angular.module('cdolStaffAppMod', ['powerSchoolModule', 'psApiModule'])
	cdolStaffApp.controller('cdolStaffAppCtrl', function ($scope, $http, $attrs, $window, psApiService) {
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
			formatKeys = {
				dateKeys: ['_date', 'dob', 'deadline'],
				checkBoxKeys: ['_created', '_ignored']
			}
			if (staffChangeId) {
				const res = await psApiService.psApiCall(`U_CDOL_STAFF_CHANGES`, `GET`, formatKeys, staffChangeId)
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
					url: `/admin/cdol/staff_change/data/${resource}.json`,
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
				maidenName: staffToSearch.middle_name.toLowerCase(),
				firstNameSubString: staffToSearch.first_name.substring(0, 3).toLowerCase()
			}
			$scope.getJSONData('staffDupData', staffDupParams)
		}

		// function to switch forms and set scope to hold form data
		$scope.formDisplay = (pageContext, prevContext, direction) => {
			$scope.userContext.pageContext = pageContext
			$scope.userContext.prevContext = prevContext
			// console.log('direction', direction)
			// console.log('pageContext', pageContext)
			// console.log('prevContext', prevContext)

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
		}

		$scope.createStaffChange = async () => {
			//adding generic fields and values needed for any payload
			const commonPayload = {
				schoolid: $scope.userContext.curSchoolId,
				calendar_year: new Date().getFullYear().toString(),
				submission_date: $scope.userContext.curDate,
				submission_time: $scope.userContext.curTime,
				who_submitted: $scope.userContext.curUserId,
				dateKeys: ['_date', 'dob', 'deadline'],
				titleKeys: ['_name'],
				sentenceKeys: ['position', 'notes'],
				deleteKeys: ['_radio', 'homeschool', 'identifier']
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
				//submitting staff changes through api
				await psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'POST', formPayload)
			})
			//sending to confirm screen after submission
			$scope.formDisplay('confirm', $scope.userContext.pageContext)
		}

		$scope.updateStaffChange = async form => {
			console.log(`Running updateStaffChange from ${form}`)
			formatKeys = {
				dateKeys: ['_date', 'dob', 'deadline'],
				checkBoxKeys: ['_created', '_ignored'],
				titleKeys: ['_name'],
				sentenceKeys: ['position', 'notes']
			}
			Object.keys($scope.submitPayload).forEach(async (key, index) => {
				let formPayload = $scope.submitPayload[key]
				formPayload.change_type = key
				//add commonPayload to each object in submitPayload
				formPayload = Object.assign(formPayload, formatKeys)

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
			let redirectPath = '/admin/cdol/staff_change/cdol_staff_change_list.html'
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
	})
	//directives for each form
	cdolStaffApp.directive('start', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/start.html' }))
	cdolStaffApp.directive('newStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/new_staff.html' }))
	cdolStaffApp.directive('transferStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/transfer_staff.html' }))
	cdolStaffApp.directive('jobChange', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/job_change.html' }))
	cdolStaffApp.directive('nameChange', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/name_change.html' }))
	cdolStaffApp.directive('exitStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/exit_staff.html' }))
	cdolStaffApp.directive('confirm', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/confirm.html' }))
	cdolStaffApp.directive('formButtons', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/form_buttons.html' }))
	cdolStaffApp.directive('creationChecks', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/creation_checks.html' }))
	cdolStaffApp.directive('tests', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tests.html' }))
})
