'use strict'
define(function (require) {
	var module = require('components/staff_change/module')
	module.factory('psApiService', [
		'$http',
		'$q',
		'formatService',
		function ($http, $q, formatService) {
			return {
				psApiCall: (tableName, method, payload, recId) => {
					let deferredResponse = $q.defer()
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
					// copying payload using spread, to keep original payload object in tact. apiPayload is what will be submitted with any API call below.
					let apiPayload = { ...payload }
					// Unique Headers
					switch (method) {
						//Create
						case 'POST':
						case 'PUT':
							if (apiPayload.dateKeys) {
								apiPayload = formatService.objIterator(apiPayload, apiPayload.dateKeys, 'formatDateForApi')
							}
							delete apiPayload.dateKeys
							if (apiPayload.checkBoxKeys) {
								apiPayload = formatService.objIterator(apiPayload, apiPayload.checkBoxKeys, 'formatChecksForApi')
							}
							delete apiPayload.checkBoxKeys
							if (apiPayload.titleKeys) {
								apiPayload = formatService.objIterator(apiPayload, apiPayload.titleKeys, 'titleCase')
							}
							delete apiPayload.titleKeys
							if (apiPayload.sentenceKeys) {
								apiPayload = formatService.objIterator(apiPayload, apiPayload.sentenceKeys, 'sentenceCase')
							}
							delete apiPayload.sentenceKeys
							if (apiPayload.deleteKeys) {
								apiPayload = formatService.objIterator(apiPayload, apiPayload.deleteKeys, 'deleteKeys')
							}
							delete apiPayload.deleteKeys
							const data = { tables: {} }
							data.tables[tableName] = apiPayload
							httpObject['data'] = data
							break
						//READ
						case 'GET':
							httpObject['params'] = {
								projection: '*'
							}
							break
					}

					$http(httpObject).then(
						res => {
							switch (method) {
								case 'POST':
								case 'PUT':
									deferredResponse.resolve(res.data.result[0].success_message.id || [])
									break
								case 'GET':
									let resData = res.data.tables[tableName]
									if (apiPayload.dateKeys) {
										resData = formatService.objIterator(resData, apiPayload.dateKeys, 'formatDateFromApi')
									}
									if (apiPayload.checkBoxKeys) {
										resData = formatService.objIterator(resData, apiPayload.checkBoxKeys, 'formatChecksFromApi')
									}
									// Remove unwanted keys change needed with version 25.6
									const keysToRemove = ['whocreated', 'whencreated', 'whomodified', 'whenmodified']
									if (Array.isArray(resData)) {
										resData = resData.map(item => {
											const filteredItem = { ...item }
											keysToRemove.forEach(key => delete filteredItem[key])
											return filteredItem
										})
									} else if (resData && typeof resData === 'object') {
										keysToRemove.forEach(key => delete resData[key])
									}
									console.log('res.data.tables[tableName]', res.data.tables[tableName])
									deferredResponse.resolve(resData)
									break
								case 'DELETE':
									deferredResponse.resolve(res)
									break
							}
						},
						res => {
							psAlert({ message: `There was an error ${method}ing the data to ${tableName}`, title: `${method} Error` })
						}
					)
					return deferredResponse.promise
				}
			}
		}
	])
})
