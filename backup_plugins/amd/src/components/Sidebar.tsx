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
 * Sidebar navigation component for REB Dashboard.
 *
 * @module     local_rebdashboard/components/Sidebar
 * @copyright  2025 Rwanda Education Board
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { getMenuItems } from '../config/menu';
import type { PageId } from '../types';

interface SidebarProps {
    activePage: PageId;
}

export default function Sidebar({ activePage }: SidebarProps) {
    const menuItems = getMenuItems();

    return (
        <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
            <div className="p-4">
                {/* Logo/Title */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-800">
                        REB Dashboard
                    </h1>
                    <p className="text-sm text-gray-500">Analytics & Reports</p>
                </div>

                {/* Navigation Menu */}
                <nav>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">
                        Menu
                    </h2>
                    <ul className="space-y-1 m-0 p-0 list-none">
                        {menuItems.map((item) => {
                            const isActive = item.id === activePage;
                            return (
                                <li key={item.id}>
                                    <a
                                        href={item.url}
                                        className={`flex items-center px-3 py-2 rounded-lg text-lg font-medium transition-colors no-underline ${
                                            isActive
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <i className={`${item.icon} w-5 mr-3 text-center`}></i>
                                        <span>{item.name}</span>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </aside>
    );
}
