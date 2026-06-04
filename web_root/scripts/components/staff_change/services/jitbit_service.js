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

			const createJitbitError = (stage, originalError) => {
				const error = new Error(stage)
				error.jitbitStage = stage
				error.originalError = originalError
				return error
			}

			const getStaffChangeName = formPayload => {
				const firstName = formPayload.first_name || ''
				const title = !['Fr.', 'Msgr.', 'Sr.', 'Br.'].some(prefix => firstName.startsWith(prefix)) && formPayload.title ? `${formPayload.title} ` : ''
				return `${title}${firstName} ${formPayload.last_name || ''}`.trim()
			}

			const getAssignedUserId = formPayload => {
				// send to Adrian (14088108) first unless it's a subStaff FSTS then to Brad (14093457) or if exitingStaff or nameChange and  canva_transfer == '1' then send to Carrie (14088738)
				if ((formPayload.change_type === 'exitingStaff' || formPayload.change_type === 'nameChange') && formPayload.canva_transfer === '1') {
					return 14088738 // Carrie
				}

				if (formPayload.change_type === 'subStaff' && formPayload.sub_type === 'FSTS') {
					return 14093457 // Brad
				}

				return 14088108 // Adrian
			}

			const getSubmissionLine = formPayload => `Submission from ${formPayload.curUserName} (${formPayload.curUserSchoolAbbr}) | ${formPayload.userEmail}`

			const extractSubmissionLine = body => {
				const bodyText = body || ''
				const submissionMatch = bodyText.match(/Submission from[\s\S]*$/)
				return submissionMatch ? submissionMatch[0].trim() : ''
			}

			const buildBody = (formPayload, submissionLine) => {
				const testTicketPrefix = formPayload.isTestServer ? 'TEST: ' : ''
				const bodySegments = []

				if (formPayload.change_type === 'transferringStaff' && formPayload.prev_school_name) {
					bodySegments.push(`Transferring-in from: ${formPayload.prev_school_name}`)
				}
				if (formPayload.change_type === 'nameChange' && formPayload.old_name_placeholder) {
					bodySegments.push(`Previous Name: ${formPayload.old_name_placeholder}`)
				}
				if (formPayload.position) bodySegments.push(`Position: ${formPayload.position}`)
				if (formPayload.previous_position) bodySegments.push(`Previous Position: ${formPayload.previous_position}`)
				if (formPayload.new_position) bodySegments.push(`New Position: ${formPayload.new_position}`)
				bodySegments.push(`Due Date: ${formPayload.deadline}`)
				if (typeof formPayload.license_microsoft !== 'undefined') bodySegments.push(`Microsoft License: ${formPayload.license_microsoft}`)
				if (typeof formPayload.notes !== 'undefined') bodySegments.push(`Notes: ${formPayload.notes}`)
				bodySegments.push(submissionLine || getSubmissionLine(formPayload))

				if (bodySegments.length) {
					bodySegments[0] = `${testTicketPrefix}${bodySegments[0]}`
				}

				return bodySegments.join('\n\n')
			}

			const buildTicketPayload = (formPayload, userId, options = {}) => {
				const staffChangeName = getStaffChangeName(formPayload)
				const testTicketPrefix = formPayload.isTestServer ? 'TEST: ' : ''

				return {
					categoryId: 588445,
					priorityId: 0,
					origin: 3,
					assignedToUserId: getAssignedUserId(formPayload),
					...(userId ? { userId: userId } : {}),
					subject: `${testTicketPrefix}${formPayload.readableChangeType} Submission ${staffChangeName} | Due Date: ${formPayload.deadline}`,
					body: buildBody(formPayload, options.submissionLine),
					customFields: JSON.stringify({ 59314: `${staffChangeName}` })
				}
			}

			const formatBodyForUpdate = body => (body || '').replace(/\r\n|\n|\r/g, '<br>')

			const buildSyncPayload = (ticketId, formPayload, dueDate, ticket) => {
				const submissionLine = extractSubmissionLine(ticket.Body) || getSubmissionLine(formPayload)
				const ticketPayload = buildTicketPayload(formPayload, null, { submissionLine: submissionLine })

				return {
					id: ticketId,
					dueDate: dueDate,
					subject: ticketPayload.subject,
					body: formatBodyForUpdate(ticketPayload.body)
				}
			}

			return {
				buildTicketPayload: buildTicketPayload,
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
							deferredResponse.reject(createJitbitError('requesterLookup', res))
						}
					)

					return deferredResponse.promise
				},
				getJitbitTicket: function (ticketId, options = {}) {
					let deferredResponse = $q.defer()
					let getTicketUrl = `${JITBIT_API_URL}ticket`

					$http({
						method: 'GET',
						url: getTicketUrl,
						params: { id: ticketId },
						headers: jibit_headers
					}).then(
						res => {
							deferredResponse.resolve(res.data || {})
						},
						res => {
							deferredResponse.reject(createJitbitError(options.errorStage || 'ticketFetch', res))
						}
					)

					return deferredResponse.promise
				},
				createJitbitTicket: async function (formPayload) {
					let userData = await this.gitJitbitUser(formPayload.userEmail)
					let ticketPayload = buildTicketPayload(formPayload, userData.UserID)

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
							deferredResponse.reject(createJitbitError('ticketCreate', res))
						}
					)

					return deferredResponse.promise
				},
				updateJitbitTicket: function (updateTicketPayload, options = {}) {
					let deferredResponse = $q.defer()
					let updateTicketUrl = `${JITBIT_API_URL}UpdateTicket`

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
							deferredResponse.reject(createJitbitError(options.errorStage || 'ticketUpdate', res))
						}
					)

					return deferredResponse.promise
				},
				setJitbitCustomField: function (ticketId, fieldId, value, options = {}) {
					let deferredResponse = $q.defer()
					let setCustomFieldUrl = `${JITBIT_API_URL}SetCustomField`

					$http({
						method: 'POST',
						url: setCustomFieldUrl,
						params: { ticketId: ticketId, fieldId: fieldId, value: value },
						headers: jibit_headers
					}).then(
						res => {
							deferredResponse.resolve(res.data || [])
						},
						res => {
							deferredResponse.reject(createJitbitError(options.errorStage || 'ticketUpdate', res))
						}
					)

					return deferredResponse.promise
				},
				syncJitbitTicketFromStaffChange: async function (ticketId, formPayload, dueDate) {
					const ticket = await this.getJitbitTicket(ticketId, { errorStage: 'ticketFetch' })
					const syncPayload = buildSyncPayload(ticketId, formPayload, dueDate, ticket)
					const staffChangeName = getStaffChangeName(formPayload)

					await this.updateJitbitTicket(syncPayload, { errorStage: 'ticketUpdate' })
					return this.setJitbitCustomField(ticketId, 59314, staffChangeName, { errorStage: 'ticketUpdate' })
				}
			}
		}
	])
})
