'use strict'
define(function (require) {
	const module = require('components/staff_change/module')

	// Keep formatting rules outside controllers so forms, lists, exports, and integrations produce identical values.
	module.factory('formatService', [
		function () {
			// PowerSchool date tokens may use a configurable order and delimiter; dateSvc records that active format.
			const dateSvc = {
				dateFormat: 'mm/dd/yyyy',
				monthIndex: 0,
				dayIndex: 1,
				yearIndex: 2,
				delimiter: '/'
			}

			return {
				dateSvc: dateSvc,
				// Read a PowerSchool date pattern such as mm/dd/yyyy and update indexes used by the legacy helpers below.
				setDateFormat: function (dateString) {
					const normalizedDateString = dateString.toLowerCase()
					const dateParts = normalizedDateString.split(/[.,\/ -]/)
					if (dateParts.length != 3) return
					if (!dateParts.includes('mm') || !dateParts.includes('dd') || !dateParts.includes('yyyy')) return
					dateSvc.dateFormat = normalizedDateString
					dateSvc.monthIndex = dateParts.indexOf('mm')
					dateSvc.dayIndex = dateParts.indexOf('dd')
					dateSvc.yearIndex = dateParts.indexOf('yyyy')
					if (normalizedDateString.indexOf('/') > 0) dateSvc.delimiter = '/'
					else if (normalizedDateString.indexOf(',') > 0) dateSvc.delimiter = ','
					else if (normalizedDateString.indexOf('.') > 0) dateSvc.delimiter = '.'
					else if (normalizedDateString.indexOf('-') > 0) dateSvc.delimiter = '-'
				},
				// Convert the form's MM/DD/YYYY value to the YYYY-MM-DD shape required by the schema API.
				formatDateForApi: function (dt) {
					if (!dt) return ''
					const dateParts = dt.split('/')
					const m = dateParts[0]
					const d = dateParts[1]
					const y = dateParts[2]
					return y + '-' + m + '-' + d
				},
				// Convert a schema API YYYY-MM-DD value back to the form's MM/DD/YYYY display shape.
				formatDateFromApi: function (dt) {
					if (!dt) return ''
					const dateParts = dt.split('-')
					const y = dateParts[0]
					const m = dateParts[1]
					const d = dateParts[2]
					return m + '/' + d + '/' + y
				},

				dateToString: function (dt) {
					let d = dt.getDate()
					let m = dt.getMonth() + 1 //January is 0!
					const y = dt.getFullYear()
					if (d < 10) d = '0' + d
					if (m < 10) m = '0' + m
					if (isNaN(m)) return ''
					return this.getPsDateString(m, d, y)
				},

				getPsDateString: function (m, d, y) {
					let returnValue = ''
					for (let index = 0; index < 3; index++) {
						if (dateSvc.monthIndex == index) returnValue += m
						else if (dateSvc.dayIndex == index) returnValue += d
						else returnValue += y
						if (index < 2) returnValue += dateSvc.delimiter
					}
					return returnValue
				},

				//accept a string date (PS date format ~[dateformat])
				//return string representation of date plus increment days
				addDays: function (dateString, increment) {
					const dateParts = dateString.split(dateSvc.delimiter)
					const m = dateParts[dateSvc.monthIndex]
					const d = dateParts[dateSvc.dayIndex]
					const y = dateParts[dateSvc.yearIndex]
					const dateVal = new Date()
					dateVal.setMonth(0)
					dateVal.setDate(d)
					dateVal.setYear(y)
					dateVal.setMonth(m - 1)
					dateVal.setDate(dateVal.getDate() + increment)
					return this.dateToString(dateVal)
				},
				// General string helpers retained for templates and integration payloads.
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

				changeMap: function (value) {
					const reverseMap = {
						newStaff: 'New Staff',
						transferringStaff: 'Transferring-In Staff',
						jobChange: 'Job Change',
						subStaff: 'Substitute',
						nameChange: 'Name Change',
						exitingStaff: 'Exiting Staff'
					}
					return reverseMap[value] || null
				},

				sentenceCase: function (str) {
					if (str !== undefined) {
						const sentences = str.split('.')
						let finalValue = ''
						for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
							let spacing = ''
							const spaceCount = sentences[sentenceIndex].replace(/^(\s*).*$/, '$1').length
							sentences[sentenceIndex] = sentences[sentenceIndex].replace(/^\s+/, '')
							const newString = sentences[sentenceIndex].charAt(0).toUpperCase() + sentences[sentenceIndex].slice(1)
							for (let spaceIndex = 0; spaceIndex < spaceCount; spaceIndex++) spacing += ' '
							finalValue += spacing + newString + '.'
						}
						finalValue = finalValue.substring(0, finalValue.length - 1)
						return finalValue
					}
				},

				titleCase: function (str) {
					const buildString = str || ''
					return buildString
						.split(' ')
						.map(function (word) {
							return word.charAt(0).toUpperCase() + word.slice(1)
						})
						.join(' ')
						.trim()
				},

				// Supports normal fields and prefixed groups such as replace_first_name. Religious prefixes already
				// embedded in first_name suppress a duplicate title, and fallbackField supports legacy exit records.
				formatStaffFullName: function (staff, options) {
					if (!staff) return ''

					if (typeof options === 'string') {
						options = { prefix: options }
					}

					options = options || {}
					const prefix = options.prefix || ''
					const religiousPrefixes = ['Fr.', 'Msgr.', 'Sr.', 'Br.']
					const normalizeNamePart = value => value === undefined || value === null ? '' : value.toString().trim()
					const fieldName = name => `${prefix}${name}`

					const title = normalizeNamePart(staff[fieldName('title')])
					const firstName = normalizeNamePart(staff[fieldName('first_name')])
					const middleName = normalizeNamePart(staff[fieldName('middle_name')])
					const lastName = normalizeNamePart(staff[fieldName('last_name')])
					const shouldShowTitle = title && !religiousPrefixes.some(religiousPrefix => firstName.startsWith(religiousPrefix))
					const fullName = [shouldShowTitle ? title : '', firstName, middleName, lastName]
						.filter(namePart => namePart)
						.join(' ')
						.replace(/\s{2,}/g, ' ')
						.trim()

					if (fullName) return fullName
					return options.fallbackField ? normalizeNamePart(staff[options.fallbackField]) : ''
				},

				// PowerSchool stores Boolean schema fields as string values, while Angular checkboxes expect real Booleans.
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

				// Apply one named formatter, or deletion rule, to matching keys in an object.
				objIterator: function (obj, iterKeys, iterType) {
					const objKeys = Object.keys(obj)
					objKeys.forEach(keyName => {
						iterKeys.forEach(iterKey => {
							const isMatch = iterType.includes('delete')
								? keyName.indexOf(iterKey) !== -1
								: iterKey.charAt(0) === '_'
									? keyName.slice(-iterKey.length) === iterKey
									: keyName === iterKey

							if (isMatch) {
								if (iterType.includes('delete')) {
									delete obj[keyName]
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
