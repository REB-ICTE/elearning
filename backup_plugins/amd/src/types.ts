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
 * TypeScript type definitions for REB Dashboard.
 *
 * @module     local_rebdashboard/types
 * @copyright  2025 Rwanda Education Board
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

export interface UserData {
    id: number;
    fullname: string;
    firstname: string;
    lastname: string;
    email: string;
    avatar: string;
    roles: string[];
    isAdmin?: boolean;
}

export interface StatsData {
    totalCourses: number;
    totalUsers: number;
    totalEnrollments: number;
    totalActivities: number;
    activeUsers?: number;
    totalTeachers?: number;
    totalStudents?: number;
}

export interface MenuItem {
    id: string;
    name: string;
    url: string;
    icon: string;
}

export type PageId = 'home' | 'completion';
