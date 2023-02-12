define(['angular'], function (angular) {
	angular.module('formatService', []).service('formatService', function () {
		//dateformats
		var dateSvc = this
		dateSvc.dateFormat = 'mm/dd/yyyy'
		dateSvc.monthIndex = 0
		dateSvc.dayIndex = 1
		dateSvc.yearIndex = 2
		dateSvc.delimiter = '/'

		this.setDateFormat = function (dateString) {
			dateString = dateString.toLowerCase()
			var dateParts = dateString.split(/[.,\/ -]/)
			if (dateParts.length != 3) return
			if (!dateParts.includes('mm') || !dateParts.includes('dd') || !dateParts.includes('yyyy')) return
			dateSvc.dateFormat = dateString
			dateSvc.monthIndex = dateParts.indexOf('mm')
			dateSvc.dayIndex = dateParts.indexOf('dd')
			dateSvc.yearIndex = dateParts.indexOf('yyyy')
			if (dateString.indexOf('/') > 0) dateSvc.delimiter = '/'
			else if (dateString.indexOf(',') > 0) dateSvc.delimiter = ','
			else if (dateString.indexOf('.') > 0) dateSvc.delimiter = '.'
			else if (dateString.indexOf('-') > 0) dateSvc.delimiter = '-'
		}

		//dt - date string (PS date format ~[dateformat])
		//return date string (yyyy-mm-dd)
		this.formatDateForApi = function (dt) {
			if (!dt) return ''
			var dateParts = dt.split(dateSvc.delimiter)
			if (dateParts.length != 3) return ''
			var m = dateParts[dateSvc.monthIndex]
			var d = dateParts[dateSvc.dayIndex]
			var y = dateParts[dateSvc.yearIndex]
			return y + '-' + m + '-' + d
		}

		//dt - date string (yyyy-dd-mm)
		//return date string (PS date format ~[dateformat])
		this.formatDateFromApi = function (dt) {
			if (!dt) return ''
			var dateParts = dt.split('-')
			if (dateParts.length != 3) return ''
			var y = dateParts[0]
			var m = dateParts[1]
			var d = dateParts[2]
			return dateSvc.getPsDateString(m, d, y)
		}

		//dt - javascript date object
		//return date string format PS date format ~[dateformat]
		this.dateToString = function (dt) {
			var d = dt.getDate()
			var m = dt.getMonth() + 1 //January is 0!
			var y = dt.getFullYear()
			if (d < 10) d = '0' + d
			if (m < 10) m = '0' + m
			if (isNaN(m)) return ''
			return dateSvc.getPsDateString(m, d, y)
		}

		this.getPsDateString = function (m, d, y) {
			returnVal = ''
			for (var i = 0; i < 3; i++) {
				if (dateSvc.monthIndex == i) returnVal += m
				else if (dateSvc.dayIndex == i) returnVal += d
				else returnVal += y
				if (i < 2) returnVal += dateSvc.delimiter
			}
			return returnVal
		}

		//accept a string date (PS date format ~[dateformat])
		//return string representation of date plus increment days
		this.addDays = function (dateString, increment) {
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
		}
		//case formats
		this.camelize = function (str) {
			return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
				if (+match === 0) return ''
				return index === 0 ? match.toLowerCase() : match.toUpperCase()
			})
		}

		this.decamelize = function (str) {
			return str
				.replace(/([A-Z])/g, ' $1')
				.trim()
				.replace(/^./, function (str) {
					return str.toUpperCase()
				})
		}

		this.sentenceCase = function (str) {
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

		this.titleCase = function (str) {
			const buildString = str || ''
			return buildString
				.toLowerCase()
				.split(' ')
				.map(function (word) {
					return word.charAt(0).toUpperCase() + word.slice(1)
				})
				.join(' ')
				.trim()
		}
		//checkmark formats
		this.formatChecksForApi = function (val) {
			val = val.toString()
			return val
		}

		this.formatChecksFromApi = function (val) {
			if (val == 'true') {
				val = true
			} else {
				val = false
			}
			return val
		}
		// object iterator
		this.objIterator = function (obj, iterKeys, iterType) {
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
	}) // End formatService
}) // End define
