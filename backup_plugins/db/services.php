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
 * Web service definitions for the REB Dashboard plugin.
 *
 * @package    local_rebdashboard
 * @copyright  2025 Rwanda Education Board
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_rebdashboard_get_course_completion_stats' => [
        'classname'    => 'local_rebdashboard\external\completion',
        'methodname'   => 'get_course_completion_stats',
        'description'  => 'Get completion statistics for a course including section and activity breakdown',
        'type'         => 'read',
        'ajax'         => true,
        'capabilities' => 'local/rebdashboard:view',
    ],
    'local_rebdashboard_get_category_completion_stats' => [
        'classname'    => 'local_rebdashboard\external\completion',
        'methodname'   => 'get_category_completion_stats',
        'description'  => 'Get completion statistics for all courses in a category (including subcategories)',
        'type'         => 'read',
        'ajax'         => true,
        'capabilities' => 'local/rebdashboard:view',
    ],
];

$services = [
    'REB Dashboard Service' => [
        'functions' => [
            'local_rebdashboard_get_course_completion_stats',
            'local_rebdashboard_get_category_completion_stats',
        ],
        'restrictedusers' => 0,
        'enabled'         => 1,
        'shortname'       => 'reb_dashboard',
    ],
];
