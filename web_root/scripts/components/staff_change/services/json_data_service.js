'use strict'
define(function (require) {
	var module = require('components/staff_change/module')

	module.factory('jsonDataService', [
		'$q',
		'$http',
		function ($q, $http) {
			const normalizeRecords = data => {
				let records = typeof psUtils !== 'undefined' && psUtils.htmlEntitiesToCharCode
					? psUtils.htmlEntitiesToCharCode(data)
					: data

				if (typeof records === 'string') {
					records = JSON.parse(records)
				}

				if (!records) return []
				return Array.isArray(records) ? records : [records]
			}

			return {
				normalizeRecords: normalizeRecords,
				getData: (resource, params = {}) => {
					const dataURL = `/admin/staff_change/json/${resource}.json`
					const rejectWithAlert = error => {
						psAlert({ message: `There was an error loading the data from ${dataURL}`, title: 'Error Loading Data' })
						return $q.reject(error)
					}

					return $http({
						url: dataURL,
						method: 'GET',
						params: params
					}).then(res => {
						try {
							return normalizeRecords(res.data)
						} catch (error) {
							return rejectWithAlert(error)
						}
					}, rejectWithAlert)
				}
			}
		}
	])
})
