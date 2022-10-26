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

		$scope.submitPayload = {}

		const todayBeforeJuly = () => {
			const curYear = new Date().getFullYear()
			const firstDay = new Date(`01/01/${curYear}`)
			const lastDay = new Date(`06/30/${curYear}`)
			const today = new Date()
			$scope.userContext.isTodayBeforeJuly = today >= firstDay && today < lastDay
		}
		todayBeforeJuly()
		
		//had to switch from PQ's to pulling this data through t_list SQL and JSON files because of PowerSchools Data Restriction Framework on PQs
		const getJSONData = async resource => {
			const res = await $http({
				url: `/admin/cdol/staff_change/data/get${resource}.json`,
				method: 'GET'
			})
			$scope[resource] = res.data
			$scope[resource].pop()
			console.log($scope[resource])
		}

		getJSONData(Schools)
		getJSONData(Users)

		// function to switch forms and set scope to hold form data
		$scope.formDipslay = (pageContext, prevContext) => {
			$scope.userContext.pageContext = pageContext
			$scope.userContext.prevContext = prevContext

			if (
				$scope.userContext.prevContext !== undefined &&
				$scope.userContext.pageContext !== 'start' &&
				$scope.userContext.pageContext !== 'confirm' &&
				$scope.userContext.pageContext !== $scope.userContext.prevContext
			) {
				delete $scope.submitPayload[prevContext]
			}
		}

		$scope.getSchool = (pageContext, schoolNum) => {
			if (schoolNum == -1) {
				$scope.submitPayload[pageContext].prev_school_name = ''
			}

			if (schoolNum && schoolNum != -1) {
				const foundSchool = $scope.schools.find(school => {
					return school.school_number === schoolNum
				})
				$scope.submitPayload[pageContext].prev_school_name = foundSchool.schoolname
			}
		}

		// pulls existing staff records and sets them to attributes on current page/from context scope
		$scope.getExistingStaff = (pageContext, userDcid) => {
			$scope.submitPayload[pageContext] = { users_dcid: userDcid }

			// // getting staff List for current change type
			if (userDcid && userDcid !== -1) {
				const foundUser = $scope.users.find(user => {
					return user.users_dcid === userDcid
				})

				$scope.submitPayload[pageContext] = Object.assign($scope.submitPayload[pageContext], foundUser)

				//PQ method below. Does not work because of DRF
				// const res = await pqService.getPQResults('net.cdolinc.staffChanges.staff.existingstaff', pqData)
				// $scope.submitPayload[pageContext] = Object.assign($scope.submitPayload[pageContext], res[0])

				if (pageContext === 'nameChange') {
					$scope.submitPayload[
						pageContext
					].old_name_placeholder = `${$scope.submitPayload[pageContext].title} ${$scope.submitPayload[pageContext].first_name} ${$scope.submitPayload[pageContext].last_name}`
				}
				if (pageContext === 'transferringStaff') {
					$scope.submitPayload[pageContext].prev_school_number = $scope.submitPayload[pageContext].homeschoolid
					$scope.submitPayload[pageContext].prev_school_name = $scope.submitPayload[pageContext].homeschoolname
				}

				$scope.$digest()
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
				// copying formPayload using spread. Then deleting any unneeded radio buttons key value pairs before sending to API call
				apiPayload = { ...formPayload }
				// get all date fields ready for API call
				apiPayload.deadline = dateService.formatDateForApi(apiPayload.deadline)
				apiPayload.dob = dateService.formatDateForApi(apiPayload.dob)
				delete apiPayload.date_radio
				delete apiPayload.homeschoolid

				//submitting staff changes through api
				await psApiService.psApiCall('U_CDOL_STAFF_CHANGES', 'POST', apiPayload)
			})
			$scope.formDipslay('confirm', $scope.userContext.pageContext)
		}
	})
	cdolStaffApp.directive('start', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/start.html' }))
	cdolStaffApp.directive('newStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/new_staff.html' }))
	cdolStaffApp.directive('transferStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/transfer_staff.html' }))
	cdolStaffApp.directive('jobChange', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/job_change.html' }))
	cdolStaffApp.directive('nameChange', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/name_change.html' }))
	cdolStaffApp.directive('exitStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/exit_staff.html' }))
	cdolStaffApp.directive('confirm', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/confirm.html' }))
})
