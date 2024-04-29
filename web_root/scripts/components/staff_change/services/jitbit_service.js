'use strict'
define(function (require) {
	var module = require('components/staff_change/module')
	module.factory('jitbitService', [
		'$http',
		'$q',
		'formatService',
		function ($http, $q, formatService) {
			const JITBIT_API_URL = 'https://cdol.jitbit.com/helpdesk/api/'

			const JITBIT_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjE0MDkyMjMzLCJhZGQiOiI3MkJFNTdDQ0EyRTFDNDk4NzY2RUE3MThBRjM5N0ZCRkM0N0JDRkJGREUxQ0UxMUFCMjQ0NTBDM0YxMjY1NTA0In0.PsicDCu7vO0ZXA6HVwPdt7GnBnC58NpcBO5gM24If1g'

			let jibit_headers = {
				'Content-Type': 'application/json',
				Authorization: `Bearer  ${JITBIT_ACCESS_TOKEN}`
			}

			return {
				gitJitbitUser: function (email) {
					let deferredResponse = $q.defer()
					let getUserUrl = `${JITBIT_API_URL}/UserByEmail?email=${email}`

					$http({
						method: 'GET',
						url: getUserUrl,
						headers: jibit_headers
					}).then(
						res => {
							deferredResponse.resolve(res.data || [])
						},
						res => {
							psAlert({ message: `There was an error hitting ${getUserUrl}`, title: 'Error getting user' })
						}
					)

					return deferredResponse.promise
				},
				createJitbitTicket: async function (formPayload) {
					let userData = await this.gitJitbitUser(formPayload.userEmail)
					console.log('formPayload', formPayload)

					let ticketPayload = {
						categoryId: 588445,
						priorityId: 0,
						origin: 3,
						assignedToUserId: 14088108,
						userId: userData.UserID,
						subject: `${formPayload.readableChangeType} Submission ${typeof formPayload.title === 'undefined' || ['Fr.', 'Msgr.', 'Sr.', 'Br.'].includes(formPayload.title) ? '' : formPayload.title}
						${formPayload.first_name} ${formPayload.last_name} | Due Date: ${formPayload.deadline}`,
						body: `${formPayload.readableChangeType}: ${typeof formPayload.title === 'undefined' || ['Fr.', 'Msgr.', 'Sr.', 'Br.'].includes(formPayload.title) ? '' : formPayload.title}
						${formPayload.first_name} ${formPayload.last_name}\nDue Date: ${formPayload.deadline}\n${typeof formPayload.notes === 'undefined' ? '' : `Notes: ${formPayload.notes}`}\nSubmission from ${formPayload.curUserName} (${formPayload.curUserSchoolAbbr}) | ${formPayload.curUserEmail}`
					}
				},
				updateJitbitTicket: function (ticket_id) {
					console.log(ticket_id)
				}
			}
		}
	])
})
