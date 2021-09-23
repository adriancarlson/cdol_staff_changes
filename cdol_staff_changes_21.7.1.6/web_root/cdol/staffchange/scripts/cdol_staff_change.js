define(['angular', 'components/shared/index', '/mbaReportCreator/scripts/dateService.js', '/cdol/scripts/checkboxService.js'], function (angular) {
	var cdolStaffApp = angular.module('cdolStaffApp', ['powerSchoolModule', 'dateService', 'checkboxModule']);
	cdolStaffApp.controller('cdolStaffAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		'$q',
		'$window',
		'dateService',
		'checkboxService',
		function ($scope, $http, $attrs, $q, $window, dateService, checkboxService) {
			// global variables passed in by gpvs assigned to attributes on the screen then passed in to angular by the $attrs and assigned to a global user context object.
			$scope.userContext = {
				newStaffTempName: 'The New Staff Member',
				pageStatus: $attrs.ngStatus,
				curSchoolId: $attrs.ngCurSchoolId,
				curYearId: $attrs.ngCurYearId,
				curDate: $attrs.ngCurDate,
				curTime: $attrs.ngCurTime,
				curUserId: $attrs.ngCurUserId,
				curStaffId: $attrs.ngStaffChangeId,
				curUserName: $attrs.ngCurUserName,
				curUserEmail: $attrs.ngCurUserEmail,
				curUserSchoolAbbr: $attrs.ngCurUserSchoolAbbr,
				accountChangeDate: '',
				adjustedYearId: new Date($attrs.ngCurDate).getFullYear() - 1991,
			};

			$scope.dupSearchParams = {
				lastName: '',
				maidenName: '',
				firstNameSubString: '',
			};

			//initializing blank staff record for use in submissions
			$scope.newStaff = {
				schoolid: $scope.userContext.curSchoolId,
				yearid: $scope.userContext.adjustedYearId.toString(),
				name_change: '',
				title: '',
				first_name: '',
				middle_name: '',
				last_name: '',
				preferred_name: '',
				gender: '',
				dob: '',
				maiden_name: '',
				religion: '',
				religiousclergylay: '',
				personal_email: '',
				staff_type: '',
				position: '',
				fte: '',
				replacing: '',
				replacing_other: '',
				previous: '',
				start_date: '',
				early_setup: '',
				deadline: '',
				previous_employer: '',
				previous_employer_other: '',
				submission_date: dateService.formatDateForApi($scope.userContext.curDate),
				submission_time: $scope.userContext.curTime,
				who_submitted: $scope.userContext.curUserId,
				notes: '',
				suggestions: '',
				ps_created: '',
				ad_created: '',
				lms_created: '',
				o365_created: '',
				final_completion_date: '',
				old_name_placeholder: '',
			};

			$scope.exitingRecord = {
				schoolid: $scope.userContext.curSchoolId,
				yearid: $scope.userContext.adjustedYearId.toString(),
				name_change: 'Exiting Staff',
				title: '',
				first_name: '',
				middle_name: '',
				last_name: '',
				preferred_name: '',
				gender: '',
				dob: '',
				maiden_name: '',
				religion: '',
				religiousclergylay: '',
				personal_email: '',
				staff_type: '',
				position: '',
				fte: '',
				replacing: $scope.newStaff.replacing,
				previous: '',
				start_date: '',
				early_setup: '',
				deadline: dateService.formatDateForApi($scope.userContext.accountChangeDate),
				previous_employer: '',
				previous_employer_other: '',
				submission_date: dateService.formatDateForApi($scope.userContext.curDate),
				submission_time: $scope.userContext.curTime,
				who_submitted: $scope.userContext.curUserId,
				notes: '',
				suggestions: '',
				ps_created: '',
				ad_created: '',
				lms_created: '',
				o365_created: '',
				final_completion_date: '',
				old_name_placeholder: '',
			};

			$scope.getExistingStaff = function () {
				$http({
					url: '/admin/cdol/staffchange/data/getExistingStaff.json',
					method: 'GET',
					params: { udcid: $scope.newStaff.replacing },
				}).then(function (response) {
					staffData = response.data;
					staffData.pop();
					if (staffData.length > 0) {
						$scope.exitingRecord.first_name = staffData[0].first_name;
						$scope.exitingRecord.last_name = staffData[0].last_name;
						$scope.exitingRecord.replacing = staffData[0].udcid.toString();
						$scope.exitingRecord.old_name_placeholder = staffData[0].first_name + ' ' + staffData[0].last_name;
						$scope.newStaff.old_name_placeholder = staffData[0].first_name + ' ' + staffData[0].last_name;
					}
				});
			};

			//if on edit screen and passing an staff change id then this runs to pull the data for the current staff change record.
			$scope.findStaffChange = function () {
				loadingDialog();
				if ($scope.userContext.curStaffId !== '') {
					$scope.newStaff.id = $scope.userContext.curStaffId;
					//get existing record
					$http({
						url: '/ws/schema/table/U_CDOL_STAFF_CHANGES/' + $scope.newStaff.id,
						method: 'GET',
						params: {
							projection: '*',
						},
					}).then(
						function mySuccess(response) {
							$scope.newStaff = response.data.tables.u_cdol_staff_changes;
							$scope.newStaff.start_date = dateService.formatDateFromApi($scope.newStaff.start_date);
							$scope.newStaff.dob = dateService.formatDateFromApi($scope.newStaff.dob);
							$scope.newStaff.deadline = dateService.formatDateFromApi($scope.newStaff.deadline);
							$scope.newStaff.ps_created = checkboxService.formatChecksFromApi($scope.newStaff.ps_created);
							$scope.newStaff.ad_created = checkboxService.formatChecksFromApi($scope.newStaff.ad_created);
							$scope.newStaff.lms_created = checkboxService.formatChecksFromApi($scope.newStaff.lms_created);
							$scope.newStaff.o365_created = checkboxService.formatChecksFromApi($scope.newStaff.o365_created);
							//setting up params for dup search
							$scope.dupSearchParams.lastName = response.data.tables.u_cdol_staff_changes.last_name;
							$scope.dupSearchParams.maidenName = response.data.tables.u_cdol_staff_changes.maiden_name;
							$scope.dupSearchParams.firstNameSubString = response.data.tables.u_cdol_staff_changes.first_name.substring(0, 3);

							if ($scope.dupSearchParams.maidenName === undefined) {
								$scope.dupSearchParams.maidenName = $scope.dupSearchParams.lastName;
							}
							$scope.searchForDups();
						},
						function myError(response) {
							psAlert({ message: 'Staff Change Data could not be loaded.', title: 'Error Loading Record' });
						},
					);
				}
				closeLoading();
			};
			$scope.searchForDups = function () {
				let lastName = $scope.dupSearchParams.lastName.toLowerCase();
				let maidenName = $scope.dupSearchParams.maidenName.toLowerCase();
				let firstNameSubString = $scope.dupSearchParams.firstNameSubString.toLowerCase();

				$http({
					url: '/admin/cdol/staffchange/data/getStaffDups.json',
					method: 'GET',
					params: {
						lastName: lastName,
						maidenName: maidenName,
						firstNameSubString: firstNameSubString,
					},
				}).then(function (response) {
					dupData = response.data;
					dupData.pop();
					$scope.dupList = dupData;
				});
			};

			//submitting New Staff change record
			$scope.submitStaffChange = function () {
				$scope.newStaff.start_date = dateService.formatDateForApi($scope.newStaff.start_date);
				$scope.newStaff.dob = dateService.formatDateForApi($scope.newStaff.dob);

				$scope.userContext.accountChangeDate = '06/15/' + $scope.userContext.curDate.substring(6, 11);
				let todayDate = new Date();
				Date.prototype.addDays = function (days) {
					var date = new Date(this.valueOf());
					date.setDate(date.getDate() + days);
					return date;
				};
				let todayPlus10 = todayDate.addDays(10);
				let month = todayPlus10.getMonth() + 1;
				let day = todayPlus10.getDate();
				let year = todayPlus10.getFullYear();
				let fulltodayPlus10 = month + '/' + day + '/' + year;
				let compareDate = new Date($scope.userContext.curDate.substring(6, 11), 05, 15);

				if (($scope.newStaff.name_change == 'Exiting Staff' || $scope.newStaff.name_change == 'Transferring Staff') && $scope.newStaff.deadline == '') {
					if (todayDate < compareDate) {
						$scope.newStaff.deadline = $scope.userContext.accountChangeDate;
					} else {
						$scope.newStaff.deadline = fulltodayPlus10;
					}
				}
				$scope.newStaff.deadline = dateService.formatDateForApi($scope.newStaff.deadline);

				if ($scope.newStaff.name_change != 'Exiting Staff') {
					if (todayDate < compareDate) {
						$scope.exitingRecord.deadline = dateService.formatDateForApi($scope.userContext.accountChangeDate);
					} else {
						$scope.exitingRecord.deadline = dateService.formatDateForApi(fulltodayPlus10);
					}
				}

				$scope.emailBody = $scope.newStaff.name_change + ' Name: ' + $scope.newStaff.title + ' ' + $scope.newStaff.first_name + ' ' + $scope.newStaff.last_name;

				if ($scope.newStaff.name_change == 'Exiting Staff') {
					$scope.emailBody = $scope.newStaff.name_change + ' Name: ' + $scope.exitingRecord.first_name + ' ' + $scope.exitingRecord.last_name;
				}

				$scope.emailData = {
					curDate: $scope.userContext.CurDate,
					curTime: $scope.userContext.CurTime,
					emailFrom: $scope.userContext.curUserEmail,
					emailTo: 'ps-support@cdolinc.net',
					emailSubject: $scope.newStaff.name_change + ' Submission from ' + $scope.userContext.curUserName + ' (' + $scope.userContext.curUserSchoolAbbr + ') | ' + $scope.userContext.curUserEmail,
					emailBody: $scope.emailBody,
				};

				let submessage = $scope.newStaff.name_change.substring(0, 1);

				let redirectPath =
					'/admin/cdol/staffchange/cdol_staff_change.html?status=Confirm&title=' +
					$scope.newStaff.title +
					'&fname=' +
					$scope.newStaff.first_name +
					'&lname=' +
					$scope.newStaff.last_name +
					'&substat=' +
					$scope.newStaff.name_change +
					'&submessage=' +
					submessage;

				if ($scope.newStaff.name_change == 'Exiting Staff') {
					redirectPath =
						'/admin/cdol/staffchange/cdol_staff_change.html?status=Confirm&title= ' +
						'&fname=' +
						$scope.exitingRecord.first_name +
						'&lname=' +
						$scope.exitingRecord.last_name +
						'&substat=' +
						$scope.newStaff.name_change +
						'&submessage=' +
						submessage;
				}

				let newRecord = {
					tables: {
						U_CDOL_STAFF_CHANGES: $scope.newStaff,
					},
				};
				let exitingRecord = {
					tables: {
						U_CDOL_STAFF_CHANGES: $scope.exitingRecord,
					},
				};

				if ($scope.newStaff.replacing != 'New' && $scope.newStaff.replacing != 'Other' && $scope.newStaff.name_change != 'Exiting Staff' && $scope.newStaff.name_change != 'Name Change') {
					$http({
						url: '/ws/schema/table/U_CDOL_STAFF_CHANGES',
						method: 'POST',
						data: exitingRecord,
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
						},
					}).then(function (response) {
						if (response.data.result[0].status == 'SUCCESS') {
							//email for exitingstaff record.
							$j.ajax({
								url: '/admin/cdol/staffchange/data/emailfields.html',
								method: 'POST',
								contentType: 'application/x-www-form-urlencoded',
								data: {
									curDate: $scope.userContext.CurDate,
									curTime: $scope.userContext.CurTime,
									emailFrom: $scope.userContext.curUserEmail,
									emailTo: 'ps-support@cdolinc.net',
									emailSubject: 'Exiting Staff Submission from ' + $scope.userContext.curUserName + ' (' + $scope.userContext.curUserSchoolAbbr + ') | ' + $scope.userContext.curUserEmail,
									emailBody: 'Exiting Staff Name: ' + $scope.exitingRecord.first_name + ' ' + $scope.exitingRecord.last_name,
								},
								success: function (result) {
									$j('#exitHoldingDiv').append(result);
								},
								complete: function () {
									var data = {
										ac: 'prim',
									};
									$j('#exitHoldingDiv')
										.find('.fireaway')
										.each(function () {
											data[$j(this).attr('name')] = $j(this).val();
										});
									$j.ajax({
										method: 'POST',
										data: data,
										complete: function () {
											$j('#exitHoldingDiv').html('');
										},
									});
								},
							});
						} else {
							psAlert({ message: 'There was an error submitting the exit record. Changes were not saved', title: 'Error Submitting Record' });
						}
					});
				}
				$http({
					url: '/ws/schema/table/U_CDOL_STAFF_CHANGES',
					method: 'POST',
					data: newRecord,
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
				}).then(function (response) {
					if (response.data.result[0].status == 'SUCCESS') {
						// ugly email jquery ajax call ... but it works.

						$j.ajax({
							url: '/admin/cdol/staffchange/data/emailfields.html',
							method: 'POST',
							contentType: 'application/x-www-form-urlencoded',
							data: $scope.emailData,
							success: function (result) {
								$j('#holdingDiv').append(result);
							},
							complete: function () {
								var data = {
									ac: 'prim',
								};
								$j('#holdingDiv')
									.find('.fireaway')
									.each(function () {
										data[$j(this).attr('name')] = $j(this).val();
									});
								$j.ajax({
									method: 'POST',
									data: data,
									complete: function () {
										$j('#holdingDiv').html('');
										$j('#staffChangeForm').submit();
									},
								});
							},
						});
					} else {
						psAlert({ message: 'There was an error submitting the record. Changes were not saved', title: 'Error Submitting Record' });
					}
				});
				$window.location.href = redirectPath;
			};

			//updating staff record
			$scope.submitStaffUpdate = function () {
				if ($scope.userContext.curStaffId !== '') {
					$scope.newStaff.start_date = dateService.formatDateForApi($scope.newStaff.start_date);
					$scope.newStaff.dob = dateService.formatDateForApi($scope.newStaff.dob);
					$scope.newStaff.deadline = dateService.formatDateForApi($scope.newStaff.deadline);
					$scope.newStaff.ps_created = checkboxService.formatChecksForApi($scope.newStaff.ps_created);
					$scope.newStaff.ad_created = checkboxService.formatChecksForApi($scope.newStaff.ad_created);
					$scope.newStaff.lms_created = checkboxService.formatChecksForApi($scope.newStaff.lms_created);
					$scope.newStaff.o365_created = checkboxService.formatChecksForApi($scope.newStaff.o365_created);
					if ($scope.newStaff.name_change != 'Exiting Staff') {
						if (
							$scope.newStaff.final_completion_date === undefined &&
							$scope.newStaff.ps_created == 'true' &&
							$scope.newStaff.ad_created == 'true' &&
							$scope.newStaff.o365_created == 'true' &&
							$scope.newStaff.lms_created == 'true'
						) {
							$scope.newStaff.final_completion_date = dateService.formatDateForApi($scope.userContext.curDate);
						}
					} else {
						if ($scope.newStaff.final_completion_date === undefined && $scope.newStaff.ps_created == 'true' && $scope.newStaff.ad_created == 'true') {
							$scope.newStaff.final_completion_date = dateService.formatDateForApi($scope.userContext.curDate);
						}
					}
					let redirectPath = '/admin/cdol/staffchange/cdol_staff_change_list.html';
					let updateRecord = {
						tables: {
							U_CDOL_STAFF_CHANGES: $scope.newStaff,
						},
					};
					$http({
						url: '/ws/schema/table/U_CDOL_STAFF_CHANGES/' + $scope.userContext.curStaffId,
						method: 'PUT',
						data: updateRecord,
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
						},
					}).then(function (response) {
						if (response.data.result[0].status == 'SUCCESS') {
						} else {
							psAlert({ message: 'There was an error updating the record. Changes were not saved', title: 'Error Updating Data' });
						}
					});
					$window.location.href = redirectPath;
				}
			};

			//Deleteing staff Record
			$scope.deleteStaffChange = function () {
				if ($scope.userContext.curStaffId !== '') {
					let redirectPath = '/admin/cdol/staffchange/cdol_staff_change_list.html';
					$http({
						url: '/ws/schema/table/U_CDOL_STAFF_CHANGES/' + $scope.userContext.curStaffId,
						method: 'DELETE',
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
						},
					});
					$window.location.href = redirectPath;
				}
			};

			// function to get PQ results
			$scope.getPowerQueryResults = function (endpoint, data) {
				var deferredResponse = $q.defer();
				$http({
					url: '/ws/schema/query/' + endpoint,
					method: 'POST',
					data: data || {},
					params: { pagesize: 0 },
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
				}).then(
					function successCallback(response) {
						deferredResponse.resolve(response.data.record || []);
					},
					function errorCallback(response) {
						psAlert({ message: 'There was an error loading the Staff Change Data', title: 'Error Loading Data' });
					},
				);
				return deferredResponse.promise;
			};

			// ajax call to list records in staff U_CDOL_STAFF_CHANGES table
			$scope.getStaffResults = function () {
				$scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.changes', { curSchoolID: $attrs.ngCurSchoolId, curYearID: $scope.userContext.adjustedYearId }).then(function (staffChangeData) {
					$scope.staffList = staffChangeData;
				});
				$scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.removals', { curSchoolID: $attrs.ngCurSchoolId, curYearID: $scope.userContext.adjustedYearId }).then(function (staffRemovalData) {
					$scope.removalStaffList = staffRemovalData;
				});
				$scope.userContext.curDate = dateService.formatDateForApi($scope.userContext.curDate);
				closeLoading();
			};
		},
	]);
});
