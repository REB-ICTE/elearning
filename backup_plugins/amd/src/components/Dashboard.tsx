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
 * Dashboard component for REB Dashboard.
 *
 * @module     local_rebdashboard/components/Dashboard
 * @copyright  2025 Rwanda Education Board
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import type { UserData, StatsData } from '../types';

interface DashboardProps {
    user: UserData;
    stats: StatsData;
}

interface StatCardProps {
    icon: string;
    value: number;
    label: string;
    color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
    return (
        <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">{label}</p>
                </div>
                <div className={`text-4xl opacity-20 ${color.replace('border-', 'text-')}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ user, stats }: DashboardProps) {
    const isAdmin = user.isAdmin || user.roles.includes('manager') || user.roles.includes('admin');

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">
                    Welcome, {user.firstname}!
                </h1>
                <p className="text-gray-600 mt-2">
                    Here's an overview of your e-learning platform.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon="📚"
                    value={stats.totalCourses}
                    label="Total Courses"
                    color="border-blue-500"
                />
                <StatCard
                    icon="👥"
                    value={stats.totalUsers}
                    label="Total Users"
                    color="border-green-500"
                />
                <StatCard
                    icon="📝"
                    value={stats.totalEnrollments}
                    label="Enrollments"
                    color="border-purple-500"
                />
                <StatCard
                    icon="📋"
                    value={stats.totalActivities}
                    label="Activities"
                    color="border-orange-500"
                />
            </div>

            {/* Admin-only Stats */}
            {isAdmin && stats.activeUsers !== undefined && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        icon="✅"
                        value={stats.activeUsers}
                        label="Active Users (30 days)"
                        color="border-teal-500"
                    />
                    {stats.totalTeachers !== undefined && (
                        <StatCard
                            icon="👨‍🏫"
                            value={stats.totalTeachers}
                            label="Teachers"
                            color="border-indigo-500"
                        />
                    )}
                    {stats.totalStudents !== undefined && (
                        <StatCard
                            icon="🎓"
                            value={stats.totalStudents}
                            label="Students"
                            color="border-pink-500"
                        />
                    )}
                </div>
            )}

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">
                    REB Dashboard
                </h2>
                <p className="text-blue-700">
                    This is the analytics dashboard for the Rwanda Education Board e-learning platform.
                    Use this dashboard to monitor platform usage, track learner progress, and access reports.
                </p>
            </div>
        </div>
    );
}
