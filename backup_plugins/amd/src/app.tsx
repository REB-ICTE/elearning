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
 * Root Preact application component for REB Dashboard.
 *
 * @module     local_rebdashboard/app
 * @copyright  2025 Rwanda Education Board
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import './styles.css';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import CompletionReport from './components/CompletionReport';
import type { UserData, StatsData, PageId } from './types';

interface AppProps {
    user: UserData;
    stats: StatsData;
    activePage: PageId;
}

export default function App({ user, stats, activePage }: AppProps) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar activePage={activePage} />
            <main className="flex-1 overflow-auto">
                {activePage === 'home' && <Dashboard user={user} stats={stats} />}
                {activePage === 'completion' && <CompletionReport />}
            </main>
        </div>
    );
}
