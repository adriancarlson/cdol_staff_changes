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
					let staffChangeName = `${!['Fr.', 'Msgr.', 'Sr.', 'Br.'].some(prefix => formPayload.first_name.startsWith(prefix)) && formPayload.title ? formPayload.title + ' ' : ''}${formPayload.first_name} ${formPayload.last_name}`

					let ticketPayload = {
						categoryId: 588445,
						priorityId: 0,
						origin: 3,
						assignedToUserId: 14088108,
						userId: userData.UserID,
						subject: `TEST ${formPayload.readableChangeType} Submission ${staffChangeName} | Due Date: ${formPayload.deadline}`,
						body: `${formPayload.position ? `Position: ${formPayload.position}\n\n` : ''}Due Date: ${formPayload.deadline}\n\n${typeof formPayload.notes === 'undefined' ? '' : `Notes: ${formPayload.notes}`}\n\nSubmission from ${formPayload.curUserName} (${formPayload.curUserSchoolAbbr}) | ${formPayload.userEmail}`,
						customFields: { 59314: `${staffChangeName}` }
					}

					let deferredResponse = $q.defer()
					let createTicketUrl = `${JITBIT_API_URL}/ticket`

					$http({
						method: 'POST',
						url: createTicketUrl,
						params: ticketPayload,
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
				updateJitbitTicket: function (updateTicketPayload) {
					console.log('from update', updateTicketPayload.id)

					let deferredResponse = $q.defer()
					let updateTicketUrl = `${JITBIT_API_URL}/UpdateTicket`

					$http({
						method: 'POST',
						url: updateTicketUrl,
						params: updateTicketPayload,
						headers: jibit_headers
					}).then(
						res => {
							deferredResponse.resolve(res.data || [])
						},
						res => {
							psAlert({ message: `There was an error hitting ${getUserUrl}`, title: 'Error getting user' })
						}
					)
				}
			}
		}
	])
})
