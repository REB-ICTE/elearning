<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * REB Dashboard completion report page.
 *
 * @package    local_rebdashboard
 * @copyright  2025 Rwanda Education Board
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/rebdashboard/lib.php');

// Require login.
require_login();

// Set up the page context.
$context = context_system::instance();
$PAGE->set_context($context);

// Check capability.
require_capability('local/rebdashboard:view', $context);

$PAGE->set_url(new moodle_url('/local/rebdashboard/completion.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title(get_string('page_title', 'local_rebdashboard') . ' - Completion Report');
$PAGE->set_heading(get_string('page_heading', 'local_rebdashboard'));

// Add body classes for plugin-specific page styling.
$PAGE->add_body_class('local-rebdashboard-plugin');
$PAGE->add_body_class('local-rebdashboard-page');
$PAGE->add_body_class('local-rebdashboard-completion');

// Load custom CSS.
$PAGE->requires->css('/local/rebdashboard/styles.css');

// Load custom JavaScript module.
$PAGE->requires->js_call_amd('local_rebdashboard/dashboard', 'init');

// Add breadcrumb navigation.
$PAGE->navbar->add(get_string('pluginname', 'local_rebdashboard'), new moodle_url('/local/rebdashboard/index.php'));
$PAGE->navbar->add('Completion Report');

// Prepare user data for Preact (via data attributes).
$userroles = [];
foreach (get_user_roles($context, $USER->id) as $role) {
    $userroles[] = $role->shortname;
}

$userdata = [
    'id' => $USER->id,
    'fullname' => fullname($USER),
    'firstname' => $USER->firstname,
    'lastname' => $USER->lastname,
    'email' => $USER->email,
    'avatar' => $OUTPUT->get_generated_image_for_id($USER->id),
    'roles' => $userroles,
];

// Prepare placeholder stats data for Preact.
$statsdata = [
    'totalCourses' => $DB->count_records('course') - 1,
    'totalUsers' => $DB->count_records('user', ['deleted' => 0]) - 1,
    'totalEnrollments' => $DB->count_records('user_enrolments'),
    'totalActivities' => $DB->count_records('course_modules'),
];

// Prepare data for template.
$templatecontext = [
    'user_data_json' => json_encode($userdata, JSON_HEX_QUOT | JSON_HEX_APOS),
    'stats_data_json' => json_encode($statsdata, JSON_HEX_QUOT | JSON_HEX_APOS),
    'active_page' => 'completion',
];

// Output the page.
echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_rebdashboard/root', $templatecontext);
echo $OUTPUT->footer();
