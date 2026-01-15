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
 * REB Dashboard module with Preact integration.
 *
 * @module     local_rebdashboard/dashboard
 * @copyright  2025 Rwanda Education Board
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { h, render } from 'preact';
import App from './app';
import type { UserData, StatsData, PageId } from './types';

/**
 * Initialize the REB Dashboard Preact application.
 *
 * Reads user and stats data from HTML data attributes and renders the app.
 *
 * @param {string} selector - CSS selector for the mount point
 */
export const init = (selector: string = '#reb-dashboard-root') => {
    const container = document.querySelector(selector);

    if (!container) {
        console.error(`Container not found: ${selector}`);
        return;
    }

    // Read data from HTML data attributes
    try {
        const userDataAttr = container.getAttribute('data-user');
        const statsDataAttr = container.getAttribute('data-stats');
        const pageAttr = container.getAttribute('data-page') as PageId | null;

        // Parse user data
        const user: UserData = userDataAttr
            ? JSON.parse(userDataAttr)
            : {
                id: 0,
                fullname: 'Guest',
                firstname: 'Guest',
                lastname: '',
                email: '',
                avatar: '',
                roles: [],
            };

        // Parse stats data
        const stats: StatsData = statsDataAttr
            ? JSON.parse(statsDataAttr)
            : {
                totalCourses: 0,
                totalUsers: 0,
                totalEnrollments: 0,
                totalActivities: 0,
            };

        // Get active page (default to 'home')
        const activePage: PageId = pageAttr || 'home';

        console.log('REB Dashboard initialized:', { user: user.fullname, activePage });

        // Render the Preact app
        render(h(App, { user, stats, activePage }), container);
    } catch (error) {
        console.error('Error initializing REB Dashboard:', error);
    }
};
