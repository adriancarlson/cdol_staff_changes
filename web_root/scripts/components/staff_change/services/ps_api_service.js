'use strict'
define(function (require) {
	const angular = require('angular')
	const module = require('components/staff_change/module')

	// Wrap PowerSchool's schema-table API so controllers work with ordinary records and form-friendly values.
	module.factory('psApiService', [
		'$http',
		'$q',
		'jsonDataService',
		'formatService',
		function ($http, $q, jsonDataService, formatService) {
			// Metadata is loaded once per table. A separate promise cache deduplicates concurrent first loads.
			const tableDefinitions = {}
			const tableDefinitionRequests = {}
			const systemKeys = ['dcid', 'whocreated', 'whencreated', 'whomodified', 'whenmodified']

			const loadTableDef = tableName => {
				const normalizedTableName = tableName.toLowerCase()

				if (tableDefinitions[normalizedTableName]) return $q.when(tableDefinitions[normalizedTableName])
				if (tableDefinitionRequests[normalizedTableName]) return tableDefinitionRequests[normalizedTableName]

				// Table metadata is a best-effort helper. If it fails, the save path falls back to the original payload.
				tableDefinitionRequests[normalizedTableName] = $http({
					url: '/admin/staff_change/data/tableDefinitionData.json',
					method: 'GET',
					params: {
						tableName: normalizedTableName
					}
				}).then(response => {
					try {
						const fields = jsonDataService.normalizeRecords(response.data)
						const tableDefinition = {
							fieldNames: [],
							dateFields: [],
							booleanFields: []
						}

						fields.forEach(field => {
							const fieldName = field.field_name && field.field_name.toLowerCase()
							if (!fieldName) return

							tableDefinition.fieldNames.push(fieldName)
							if (field.data_type === 'Date') tableDefinition.dateFields.push(fieldName)
							if (field.data_type === 'Boolean') tableDefinition.booleanFields.push(fieldName)
						})

						tableDefinitions[normalizedTableName] = tableDefinition
						delete tableDefinitionRequests[normalizedTableName]
						return tableDefinition
					} catch (error) {
						delete tableDefinitionRequests[normalizedTableName]
						return $q.reject(error)
					}
				}, error => {
					delete tableDefinitionRequests[normalizedTableName]
					return $q.reject(error)
				})

				return tableDefinitionRequests[normalizedTableName]
			}

			// Date and Boolean field lists come from PowerSchool metadata rather than controller-maintained key arrays.
			const formatPayloadFields = (payload, fields, formatter) => {
				fields.forEach(fieldName => {
					if (Object.prototype.hasOwnProperty.call(payload, fieldName)) {
						payload[fieldName] = formatService[formatter](payload[fieldName])
					}
				})
				return payload
			}

			// Lookup rows contain useful display fields that are not database columns; never send those to the schema API.
			const stripInvalidPayloadFields = (payload, tableDefinition) => {
				Object.keys(payload).forEach(key => {
					const normalizedKey = key.toLowerCase()
					if (systemKeys.indexOf(normalizedKey) !== -1 || tableDefinition.fieldNames.indexOf(normalizedKey) === -1) {
						delete payload[key]
					}
				})
				return payload
			}

			const stripSystemFields = record => {
				if (!record || typeof record !== 'object') return record

				systemKeys.forEach(key => delete record[key])
				return record
			}

			const formatResponseFields = (records, tableDefinition) => {
				const recordList = Array.isArray(records) ? records : [records]

				recordList.forEach(record => {
					if (!record || typeof record !== 'object') return

					formatPayloadFields(record, tableDefinition.dateFields, 'formatDateFromApi')
					formatPayloadFields(record, tableDefinition.booleanFields, 'formatChecksFromApi')
				})

				return records
			}

			const prepareApiPayload = (apiPayload, tableDefinition) => {
				formatPayloadFields(apiPayload, tableDefinition.dateFields, 'formatDateForApi')
				formatPayloadFields(apiPayload, tableDefinition.booleanFields, 'formatChecksForApi')
				return stripInvalidPayloadFields(apiPayload, tableDefinition)
			}

			// Convert PowerSchool's different method-specific envelopes into the small return values controllers expect.
			const sendApiRequest = (httpObject, method, tableName, recId) => {
				return $http(httpObject).then(
					res => {
						switch (method) {
							case 'POST':
							case 'PUT': {
								const result = res.data && res.data.result && res.data.result[0]
								const successMessage = result && result.success_message
								const errorMessage = result && result.error_message

								if (errorMessage) {
									psAlert({ message: errorMessage, title: `${method} Error` })
									return $q.reject(errorMessage)
								}

								return (successMessage && successMessage.id) || recId || []
							}
							case 'GET':
								let resData = res.data.tables[tableName]
								return loadTableDef(tableName).then(tableDefinition => {
									formatResponseFields(resData, tableDefinition)

									if (Array.isArray(resData)) {
										resData = resData.map(item => stripSystemFields(angular.copy(item)))
									} else {
										stripSystemFields(resData)
									}

									return resData
								}, () => {
									if (Array.isArray(resData)) {
										return resData.map(item => stripSystemFields(angular.copy(item)))
									}

									return stripSystemFields(resData)
								})
							case 'DELETE':
								return res
						}
					},
					res => {
						psAlert({ message: `There was an error ${method}ing the data to ${tableName}`, title: `${method} Error` })
						return $q.reject(res)
					}
				)
			}

			return {
				loadTableDef: loadTableDef,
				psApiCall: (tableName, method, payload, recId) => {
					tableName = tableName.toLowerCase()
					let path = `/ws/schema/table/${tableName}`
					let url = `${path}${recId ? `/${recId}` : ''}`
					let headers = {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					}
					let httpObject = {
						url: `${url}`,
						method: method,
						headers: headers
					}
					// Keep formatting and sanitizing mutations isolated from the live form bound to $scope.
					let apiPayload = angular.copy(payload || {})
					// POST and PUT require PowerSchool's { tables: { tableName: record } } envelope.
					switch (method) {
						case 'POST':
						case 'PUT':
							return loadTableDef(tableName).then(tableDefinition => {
								const data = { tables: {} }
								data.tables[tableName] = prepareApiPayload(apiPayload, tableDefinition)
								httpObject['data'] = data
								return sendApiRequest(httpObject, method, tableName, recId)
							}, () => {
								const data = { tables: {} }
								data.tables[tableName] = apiPayload
								httpObject['data'] = data
								return sendApiRequest(httpObject, method, tableName, recId)
							})
						// GET requests use projection=* so edit forms receive every table field.
						case 'GET':
							httpObject['params'] = {
								projection: '*'
							}
							break
					}

					return sendApiRequest(httpObject, method, tableName, recId)
				}
			}
		}
	])
})
