'use strict'
define(function (require) {
	var module = require('components/staff_change/module')

	module.factory('formatService', [
		function () {
			var dateSvc = {
				dateFormat: 'mm/dd/yyyy',
				monthIndex: 0,
				dayIndex: 1,
				yearIndex: 2,
				delimiter: '/'
			}

			return {
				dateSvc: dateSvc,
				setDateFormat: function (dateString) {
					dateString = dateString.toLowerCase()
					var dateParts = dateString.split(/[.,\/ -]/)
					if (dateParts.length != 3) return
					if (!dateParts.includes('mm') || !dateParts.includes('dd') || !dateParts.includes('yyyy')) return
					dateFormat = dateString
					monthIndex = dateParts.indexOf('mm')
					dayIndex = dateParts.indexOf('dd')
					yearIndex = dateParts.indexOf('yyyy')
					if (dateString.indexOf('/') > 0) delimiter = '/'
					else if (dateString.indexOf(',') > 0) delimiter = ','
					else if (dateString.indexOf('.') > 0) delimiter = '.'
					else if (dateString.indexOf('-') > 0) delimiter = '-'
				},
				//dt - date string (PS date format ~[dateformat])
				//return date string (yyyy-mm-dd)
				formatDateForApi: function (dt) {
					if (!dt) return ''
					let dateParts = dt.split('/')
					let m = dateParts[0]
					let d = dateParts[1]
					let y = dateParts[2]
					return y + '-' + m + '-' + d
				},
				//dt - date string (yyyy-dd-mm)
				//return date string (PS date format ~[dateformat])
				formatDateFromApi: function (dt) {
					if (!dt) return ''
					let dateParts = dt.split('-')
					let y = dateParts[0]
					let m = dateParts[1]
					let d = dateParts[2]
					return m + '/' + d + '/' + y
				},

				dateToString: function (dt) {
					var d = dt.getDate()
					var m = dt.getMonth() + 1 //January is 0!
					var y = dt.getFullYear()
					if (d < 10) d = '0' + d
					if (m < 10) m = '0' + m
					if (isNaN(m)) return ''
					return dateSvc.getPsDateString(m, d, y)
				},

				getPsDateString: function (m, d, y) {
					returnVal = ''
					for (var i = 0; i < 3; i++) {
						if (dateSvc.monthIndex == i) returnVal += m
						else if (dateSvc.dayIndex == i) returnVal += d
						else returnVal += y
						if (i < 2) returnVal += dateSvc.delimiter
					}
					return returnVal
				},

				//accept a string date (PS date format ~[dateformat])
				//return string representation of date plus increment days
				addDays: function (dateString, increment) {
					var dateParts = dateString.split(dateSvc.delimiter)
					var m = dateParts[dateSvc.monthIndex]
					var d = dateParts[dateSvc.dayIndex]
					var y = dateParts[dateSvc.yearIndex]
					var dateVal = new Date()
					dateVal.setMonth(0)
					dateVal.setDate(d)
					dateVal.setYear(y)
					dateVal.setMonth(m - 1)
					dateVal.setDate(dateVal.getDate() + increment)
					return this.dateToString(dateVal)
				},
				//case formats
				camelize: function (str) {
					return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
						if (+match === 0) return ''
						return index === 0 ? match.toLowerCase() : match.toUpperCase()
					})
				},

				decamelize: function (str) {
					return str
						.replace(/([A-Z])/g, ' $1')
						.trim()
						.replace(/^./, function (str) {
							return str.toUpperCase()
						})
				},

				sentenceCase: function (str) {
					if (str !== undefined) {
						var n = str.split('.')
						var vfinal = ''
						for (i = 0; i < n.length; i++) {
							var spaceput = ''
							var spaceCount = n[i].replace(/^(\s*).*$/, '$1').length
							n[i] = n[i].replace(/^\s+/, '')
							var newstring = n[i].charAt(n[i]).toUpperCase() + n[i].slice(1)
							for (j = 0; j < spaceCount; j++) spaceput = spaceput + ' '
							vfinal = vfinal + spaceput + newstring + '.'
						}
						vfinal = vfinal.substring(0, vfinal.length - 1)
						return vfinal
					}
				},

				titleCase: function (str) {
					const buildString = str || ''
					return buildString
						.toLowerCase()
						.split(' ')
						.map(function (word) {
							return word.charAt(0).toUpperCase() + word.slice(1)
						})
						.join(' ')
						.trim()
				},

				//checkmark formats
				formatChecksForApi: function (val) {
					val = val.toString()
					return val
				},

				formatChecksFromApi: function (val) {
					if (val == 'true') {
						val = true
					} else {
						val = false
					}
					return val
				},

				// object iterator
				objIterator: function (obj, iterKeys, iterType) {
					const objKeys = Object.keys(obj)
					objKeys.forEach(keyName => {
						// looping through first object
						iterKeys.forEach(iterKey => {
							// using index of to check if the object key name have a matched string if so deleting it from the payload
							if (keyName.indexOf(iterKey) !== -1) {
								// if iterType contains delete than delete the key
								if (iterType.includes('delete')) {
									delete obj[keyName]
									// else perfore an iterType function on the key
								} else {
									obj[keyName] = this[iterType](obj[keyName])
								}
							}
						})
					})
					return obj
				}
			}
		}
	])
})
