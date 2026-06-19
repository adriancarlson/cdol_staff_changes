# CDOL Staff Change

PowerSchool plugin for submitting, tracking, and completing diocesan staff changes. It coordinates work across PowerSchool, Active Directory, Microsoft 365, iPad/Jamf, LMS, Canva, and Jitbit.

## Administrator Workflow Map

The iPad step appears only when the submitter or administrator answers **Yes** to the iPad question. Canva is conditional for Name Change and Exit workflows. FSTS substitutes do not use the iPad workflow.

- **New Staff with iPad:** PowerSchool (Adrian) -> AD (Brad) -> O365 (Brad) -> iPad (Greg) -> LMS (Shane) -> Canva (Carrie)
- **New Staff without iPad:** PowerSchool (Adrian) -> AD (Brad) -> O365 (Brad) -> LMS (Shane) -> Canva (Carrie)

- **Transferring-In with iPad:** PowerSchool (Adrian) -> AD (Brad) -> O365 (Brad) -> iPad (Greg) -> LMS (Shane) -> Canva (Carrie)
- **Transferring-In without iPad:** PowerSchool (Adrian) -> AD (Brad) -> O365 (Brad) -> LMS (Shane) -> Canva (Carrie)

- **Position/Job Change with iPad:** PowerSchool (Adrian) -> AD (Brad) -> iPad (Greg)
- **Position/Job Change without iPad:** PowerSchool (Adrian) -> AD (Brad)

- **LTS Substitute with iPad:** PowerSchool (Adrian) -> AD (Brad) -> O365 (Brad) -> iPad (Greg) -> LMS (Shane)
- **LTS Substitute without iPad:** PowerSchool (Adrian) -> AD (Brad) -> O365 (Brad) -> LMS (Shane)
- **FSTS Substitute:** AD (Brad) -> O365 (Brad)

- **Name Change with Canva and iPad:** Canva (Carrie) -> PowerSchool (Adrian) -> AD (Brad) -> O365 (Brad) -> iPad (Greg) -> LMS (Shane)
- **Name Change with Canva, without iPad:** Canva (Carrie) -> PowerSchool (Adrian) -> AD (Brad) -> O365 (Brad) -> LMS (Shane)
- **Name Change without Canva, with iPad:** PowerSchool (Adrian) -> AD (Brad) -> O365 (Brad) -> iPad (Greg) -> LMS (Shane)
- **Name Change without Canva or iPad:** PowerSchool (Adrian) -> AD (Brad) -> O365 (Brad) -> LMS (Shane)

- **Exit with Canva and iPad:** Canva (Carrie) -> PowerSchool (Adrian) -> AD (Brad) -> iPad (Greg)
- **Exit with Canva, without iPad:** Canva (Carrie) -> PowerSchool (Adrian) -> AD (Brad)
- **Exit without Canva, with iPad:** PowerSchool (Adrian) -> AD (Brad) -> iPad (Greg)
- **Exit without Canva or iPad:** PowerSchool (Adrian) -> AD (Brad)

These paths describe the visual and completion workflow. They do not enforce that administrators complete the checks in sequence.

## Workflow Rules

- Supported change types are New Staff, Transferring-In, Position/Job Change, Substitute, Name Change, and Exiting Staff.
- iPad questions apply to New Staff, Transferring-In, Position/Job Change, LTS Substitute, Name Change, and Exit.
- FSTS substitutes are excluded from the iPad workflow.
- A Yes iPad answer displays the administrator iPad/Jamf completion card.
- Administrators may correct the original Yes/No answer. Changing it clears previous iPad Complete and Not Applicable values.
- Legacy records with no iPad answer remain editable and treat iPad as not applicable.
- The Exit iPad step is always placed last. Other iPad steps follow Brad's AD/O365 work.
- Canva is always part of New Staff and Transferring-In workflows and is conditional for Name Change and Exit.

## Main Features

- Guided staff-change submission forms with validation and confirmation.
- District administrator edit and completion workflows.
- Conditional account checks for each change type.
- Jitbit ticket creation and synchronization.
- Business-day deadline validation and emergency override support.
- Duplicate staff-change and PowerSchool staff detection.
- Staff-change lists with filtering, sorting, counts, and export support.
- Gender-aware display filters for subject, object, and possessive pronouns.

## Application Pages

- `/admin/staff_change/submit.html` - Starts new submissions and edits existing staff changes.
- `/admin/staff_change/list.html` - Displays change-type tabs, completion state, deadlines, and exports.

The frontend uses AngularJS modules loaded through RequireJS and PowerSchool page components.

## Project Structure

- `plugin.xml` - PowerSchool plugin manifest and deployable version.
- `user_schema_root/` - `U_CDOL_STAFF_CHANGES` standalone extension table.
- `permissions_root/` - PowerSchool permission mappings.
- `pagecataloging/` - PowerSchool page catalog metadata.
- `web_root/admin/staff_change/` - Submit/list pages, form templates, list templates, and JSON query endpoints.
- `web_root/scripts/components/staff_change/` - AngularJS controllers, directives, services, filters, API access, and Jitbit integration.
- `web_root/admin/faculty/` - PowerSchool faculty-page customizations used by staff-change workflows.
- `web_root/wildcards/` - Staff-change count and navigation integrations.

## Data Model

Staff changes are stored in `U_CDOL_STAFF_CHANGES`. Important workflow fields include:

- `change_type`, `sub_type`, `deadline`, and `final_completion_date`
- `ps_created`, `ad_created`, `o365_created`, and `lms_created`
- Matching `*_ignored` fields where Not Applicable is supported
- `canva_transfer`, `canva_created`, and `canva_ignored`
- `ipad_needed`, `ipad_created`, and `ipad_ignored`
- `ticket_id` for the associated Jitbit ticket
