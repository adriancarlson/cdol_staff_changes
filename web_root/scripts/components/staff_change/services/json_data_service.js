'use strict'
define(function (require) {
	const angular = require('angular')
	const module = require('components/staff_change/module')

	module.factory('jsonDataService', [
		'$q',
		'$http',
		function ($q, $http) {
			const cacheableResources = {
				titleData: true,
				schoolData: true,
				userData: true
			}
			const dataCache = {}
			const requestCache = {}

			const stableSerialize = value => {
				if (value === null || typeof value !== 'object') return JSON.stringify(value)
				if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`

				return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`
			}

			const getCacheKey = (resource, params) => `${resource}:${stableSerialize(params || {})}`

			const shouldCache = (resource, options) => {
				options = options || {}
				if (options.cache === false) return false
				return options.cache === true || !!cacheableResources[resource]
			}

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
				getData: (resource, params = {}, options = {}) => {
					const dataURL = `/admin/staff_change/data/${resource}.json`
					const useCache = shouldCache(resource, options)
					const cacheKey = getCacheKey(resource, params)
					const rejectWithAlert = error => {
						psAlert({ message: `There was an error loading the data from ${dataURL}`, title: 'Error Loading Data' })
						return $q.reject(error)
					}

					if (useCache && dataCache[cacheKey]) {
						return $q.when(angular.copy(dataCache[cacheKey]))
					}

					if (useCache && requestCache[cacheKey]) {
						return requestCache[cacheKey].then(records => angular.copy(records))
					}

					const request = $http({
						url: dataURL,
						method: 'GET',
						params: params
					}).then(res => {
						try {
							const records = normalizeRecords(res.data)
							if (useCache) dataCache[cacheKey] = angular.copy(records)
							return records
						} catch (error) {
							return rejectWithAlert(error)
						}
					}, rejectWithAlert).finally(() => {
						if (useCache) delete requestCache[cacheKey]
					})

					if (useCache) requestCache[cacheKey] = request
					return request.then(records => angular.copy(records))
				}
			}
		}
	])
})
