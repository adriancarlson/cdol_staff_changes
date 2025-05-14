'use strict'
define(function (require) {
	var module = require('components/staff_change/module')
	module.factory('jitbitService', [
		'$http',
		'$q',
		function ($http, $q) {
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

					// send to Adrian (14088108) first unless it's a subStaff FSTS then to Brad (14093457) or if exitingStaff or nameChange and  canva_transfer == '1' then send to Carrie (14088738)
					let assignedUserId

					if ((formPayload.change_type === 'exitingStaff' || formPayload.change_type === 'nameChange') && formPayload.canva_transfer === '1') {
						assignedUserId = 14088738 // Carrie
					} else if (formPayload.change_type === 'subStaff' && formPayload.sub_type === 'FSTS') {
						assignedUserId = 14093457 // Brad
					} else {
						assignedUserId = 14088108 // Adrian
					}

					let ticketPayload = {
						categoryId: 588445,
						priorityId: 0,
						origin: 3,
						assignedToUserId: assignedUserId,
						userId: userData.UserID,
						subject: `${formPayload.readableChangeType} Submission ${staffChangeName} | Due Date: ${formPayload.deadline}`,
						body: `${formPayload.change_type === 'transferringStaff' && formPayload.prev_school_name ? `Transferring-in from: ${formPayload.prev_school_name}\n\n` : ''}${formPayload.change_type === 'nameChange' && formPayload.old_name_placeholder ? `Previous Name: ${formPayload.old_name_placeholder}\n\n` : ''}${formPayload.position ? `Position: ${formPayload.position}\n\n` : ''}${formPayload.previous_position ? `Previous Position: ${formPayload.previous_position}\n\n` : ''}${formPayload.new_position ? `New Position: ${formPayload.new_position}\n\n` : ''}Due Date: ${formPayload.deadline}\n\n${typeof formPayload.license_microsoft === 'undefined' ? '' : `Microsoft License: ${formPayload.license_microsoft}`}\n\n${typeof formPayload.notes === 'undefined' ? '' : `Notes: ${formPayload.notes}`}\n\nSubmission from ${formPayload.curUserName} (${formPayload.curUserSchoolAbbr}) | ${formPayload.userEmail}`,
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
