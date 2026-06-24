'use strict'
define(function (require) {
	// Register list-tab directives and the export control used by the list page.
	require('components/staff_change/directives/tabs/all_staff_list')
	require('components/staff_change/directives/tabs/exit_staff_list')
	require('components/staff_change/directives/tabs/export_button')
	require('components/staff_change/directives/tabs/job_change_list')
	require('components/staff_change/directives/tabs/name_change_list')
	require('components/staff_change/directives/tabs/new_staff_list')
	require('components/staff_change/directives/tabs/staff_workflow_progress')
	require('components/staff_change/directives/tabs/sub_staff_list')
	require('components/staff_change/directives/tabs/transfer_staff_list')
})
