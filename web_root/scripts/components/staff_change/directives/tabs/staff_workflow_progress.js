'use strict'
define(function (require) {
	const module = require('components/staff_change/module')

	module.directive('staffWorkflowProgress', [
		function () {
			return {
				scope: {
					staffRecord: '=',
					openProgress: '&'
				},
				template: `
					<button type="button" class="workflow-progress-button" data-ng-click="openProgress({staffRecord: staffRecord})"
						data-ng-class="::staffRecord.progress_button_class"
						data-ng-attr-aria-label="View workflow progress for {{staffRecord.display_name}}">
						<span class="workflow-progress-stepper workflow-progress-stepper-compact"
							data-ng-attr-aria-label="{{staffRecord.progress_aria_label}}">
							<span data-ng-repeat="step in staffRecord.progress_steps track by step.key" class="workflow-progress-step"
								data-ng-class="step.className" data-ng-attr-title="{{step.title}}">
								<span class="workflow-progress-marker">
									<pds-icon data-ng-attr-name="{{step.icon}}"
										class="workflow-progress-icon x-scope pds-icon-0 pds-widget" pds-widget="pds-widget">
										<template is="dom-if" class="style-scope pds-icon"></template>
										<svg aria-hidden="true" focusable="false" class="pds-icon-svg style-scope pds-icon"></svg>
									</pds-icon>
								</span>
							</span>
						</span>
						<span class="workflow-progress-meta">
							<span class="workflow-progress-count">{{::staffRecord.progress_completed}}/{{::staffRecord.progress_total}}</span>
							<span class="workflow-progress-status" data-ng-class="::staffRecord.progress_status_class">{{::staffRecord.progress_status}}</span>
						</span>
					</button>`
			}
		}
	])
})
