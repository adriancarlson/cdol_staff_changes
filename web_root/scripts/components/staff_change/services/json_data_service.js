'use strict'
define(function (require) {
	const angular = require('angular')
	const module = require('components/staff_change/module')

	// AngularJS factories are singletons, so these caches are shared by every controller on the current page.
	module.factory('jsonDataService', [
		'$q',
		'$http',
		function ($q, $http) {
			// Only stable lookup resources cache by default. Lists, counts, and searches must remain fresh.
			const cacheableResources = {
				titleData: true,
				schoolData: true,
				userData: true
			}
			const dataCache = {}
			// requestCache stores in-flight promises so simultaneous callers share one HTTP request.
			const requestCache = {}

			// Sorting object keys makes logically identical parameter objects produce the same cache key.
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

			// PowerSchool may return encoded JSON text, one object, an array, or an empty response.
			// Normalize all of those shapes to an array so callers do not need endpoint-specific handling.
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

					// angular.copy prevents one controller from mutating records held in the shared cache.
					if (useCache && dataCache[cacheKey]) {
						return $q.when(angular.copy(dataCache[cacheKey]))
					}

					if (useCache && requestCache[cacheKey]) {
						return requestCache[cacheKey].then(records => angular.copy(records))
					}

					// $http returns an Angular promise; its callbacks automatically participate in the digest cycle.
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
						// Failed requests are never retained, so a later visit can retry the endpoint.
						if (useCache) delete requestCache[cacheKey]
					})

					if (useCache) requestCache[cacheKey] = request
					return request.then(records => angular.copy(records))
				}
			}
		}
	])
})
