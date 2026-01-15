# Offline-First Moodle Sync System - Technical Design Specification

**Version:** 1.0
**Date:** January 2025
**Author:** REB Rwanda Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Component Design](#3-component-design)
4. [Data Flow](#4-data-flow)
5. [Sync Protocol](#5-sync-protocol)
6. [Conflict Resolution](#6-conflict-resolution)
7. [ID Management](#7-id-management)
8. [Security](#8-security)
9. [Error Handling](#9-error-handling)
10. [Monitoring](#10-monitoring)
11. [Deployment](#11-deployment)
12. [API Reference](#12-api-reference)

---

## 1. Executive Summary

### 1.1 Purpose

This document describes the technical design for a bidirectional sync system enabling Moodle instances at schools with poor internet connectivity to operate offline while synchronizing data with a central production server when connectivity is available.

### 1.2 Goals

- **Offline-First:** Schools operate fully offline; sync happens opportunistically
- **Bidirectional Sync:** Grades/submissions flow up, courses/users flow down
- **Zero-Touch:** No local IT required at schools
- **Scale:** Support 20+ school instances
- **Data Integrity:** No data loss, conflict resolution for concurrent edits

### 1.3 Scope

| In Scope | Out of Scope |
|----------|--------------|
| Event capture and queuing | Real-time collaboration |
| Bidirectional data sync | Video conferencing sync |
| Conflict resolution | External system integrations |
| ID mapping | Multi-language content |
| File sync for submissions | Course content authoring at schools |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CENTRAL SERVER                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────────┐ │
│  │    Moodle    │  │   MariaDB    │  │        local/syncapi           │ │
│  │   (Master)   │  │   (Master)   │  │  - Upload endpoint             │ │
│  │              │  │              │  │  - Download endpoint           │ │
│  │              │  │              │  │  - Conflict resolver           │ │
│  └──────────────┘  └──────────────┘  │  - School registry             │ │
│                                       └────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │                      MinIO S3 File Storage                           ││
│  └──────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                        ═══════════════════════
                        Intermittent Internet
                        ═══════════════════════
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   School A    │           │   School B    │           │   School N    │
│ ┌───────────┐ │           │ ┌───────────┐ │           │ ┌───────────┐ │
│ │  Moodle   │ │           │ │  Moodle   │ │           │ │  Moodle   │ │
│ │  (Local)  │ │           │ │  (Local)  │ │           │ │  (Local)  │ │
│ └───────────┘ │           │ └───────────┘ │           │ └───────────┘ │
│ ┌───────────┐ │           │ ┌───────────┐ │           │ ┌───────────┐ │
│ │  syncqueue│ │           │ │  syncqueue│ │           │ │  syncqueue│ │
│ │  plugin   │ │           │ │  plugin   │ │           │ │  plugin   │ │
│ └───────────┘ │           └───────────────┘           └───────────────┘
│ ┌───────────┐ │
│ │  MariaDB  │ │
│ │  (Local)  │ │
│ └───────────┘ │
└───────────────┘
```

### 2.2 Component Overview

| Component | Location | Purpose |
|-----------|----------|---------|
| `local/syncqueue` | School | Capture events, queue for sync |
| `local/syncapi` | Central | API for receiving/sending data |
| Sync Daemon | School | Background connectivity monitor |
| ID Mapper | Both | Track local↔central ID relationships |

---

## 3. Component Design

### 3.1 Sync Queue Plugin (`local/syncqueue`)

**Location:** `moodle_app/local/syncqueue/`

**Purpose:** Capture Moodle events and queue them for synchronization.

#### 3.1.1 Directory Structure

```
local/syncqueue/
├── version.php                    # Plugin metadata
├── settings.php                   # Admin settings
├── db/
│   ├── install.xml               # Database schema
│   ├── events.php                # Event observers
│   └── tasks.php                 # Scheduled tasks
├── classes/
│   ├── observer.php              # Event handlers
│   ├── queue_manager.php         # Queue CRUD operations
│   ├── sync_client.php           # HTTP client for sync
│   ├── update_processor.php      # Process downloaded updates
│   ├── id_mapper.php             # ID mapping utility
│   └── task/
│       ├── process_queue.php     # Upload task
│       ├── download_updates.php  # Download task
│       └── cleanup.php           # Cleanup task
├── cli/
│   └── sync.php                  # CLI sync tool
└── lang/en/
    └── local_syncqueue.php       # Language strings
```

#### 3.1.2 Database Schema

**Table: `local_syncqueue_items`**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| schoolid | VARCHAR(50) | School identifier |
| eventtype | VARCHAR(50) | Category: grade, submission, quiz, etc. |
| eventname | VARCHAR(255) | Full Moodle event name |
| objecttable | VARCHAR(100) | Affected table |
| objectid | BIGINT | Local object ID |
| relateduserid | BIGINT | Related user ID |
| courseid | BIGINT | Course ID |
| payload | TEXT | JSON encoded event data |
| payloadhash | CHAR(64) | SHA256 for deduplication |
| priority | TINYINT | 1-10, 1=highest |
| status | VARCHAR(20) | pending/processing/synced/failed/conflict |
| attempts | TINYINT | Retry count |
| lasterror | TEXT | Last error message |
| timecreated | BIGINT | Queue timestamp |
| timemodified | BIGINT | Last update |
| timesynced | BIGINT | Sync timestamp |

**Table: `local_syncqueue_idmap`**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| schoolid | VARCHAR(50) | School identifier |
| tablename | VARCHAR(100) | Moodle table |
| localid | BIGINT | ID on local instance |
| centralid | BIGINT | ID on central server |
| centralhash | CHAR(64) | Hash for conflict detection |
| timecreated | BIGINT | Created timestamp |
| timemodified | BIGINT | Modified timestamp |

**Table: `local_syncqueue_log`**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| schoolid | VARCHAR(50) | School identifier |
| direction | VARCHAR(10) | upload/download |
| itemcount | INT | Items processed |
| successcount | INT | Successful items |
| failcount | INT | Failed items |
| conflictcount | INT | Conflicts |
| duration | DECIMAL(10,3) | Seconds |
| status | VARCHAR(20) | success/partial/failed |
| details | TEXT | JSON details |
| timecreated | BIGINT | Timestamp |

**Table: `local_syncqueue_files`**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| queueitemid | BIGINT | Related queue item |
| schoolid | VARCHAR(50) | School identifier |
| contenthash | CHAR(40) | Moodle file hash |
| filename | VARCHAR(255) | Original filename |
| filesize | BIGINT | Size in bytes |
| mimetype | VARCHAR(100) | MIME type |
| status | VARCHAR(20) | pending/synced/failed |
| timecreated | BIGINT | Created timestamp |
| timesynced | BIGINT | Synced timestamp |

#### 3.1.3 Event Capture

Events captured and queued:

| Event Type | Moodle Event | Priority | Direction |
|------------|--------------|----------|-----------|
| Grade | `\core\event\user_graded` | 1 (Critical) | School→Central |
| Submission | `\mod_assign\event\submission_*` | 2 | School→Central |
| Quiz | `\mod_quiz\event\attempt_submitted` | 1 | School→Central |
| Forum | `\mod_forum\event\post_created` | 5 | School→Central |
| Enrollment | `\core\event\user_enrolment_*` | 3 | Bidirectional |
| Completion | `\core\event\course_*_completion` | 4 | School→Central |
| User | `\core\event\user_created/updated` | 3 | Bidirectional |

### 3.2 Sync API Plugin (`local/syncapi`)

**Location:** Central server `moodle/local/syncapi/`

**Purpose:** Receive uploads from schools, send updates to schools.

#### 3.2.1 External Functions

```php
// In db/services.php
$functions = [
    'local_syncapi_status' => [
        'classname' => 'local_syncapi\external\status',
        'description' => 'Check API status and school registration',
        'type' => 'read',
        'ajax' => true,
    ],
    'local_syncapi_upload' => [
        'classname' => 'local_syncapi\external\upload',
        'description' => 'Upload queued items from school',
        'type' => 'write',
        'ajax' => true,
    ],
    'local_syncapi_download' => [
        'classname' => 'local_syncapi\external\download',
        'description' => 'Download updates for school',
        'type' => 'read',
        'ajax' => true,
    ],
    'local_syncapi_report' => [
        'classname' => 'local_syncapi\external\report',
        'description' => 'Report sync completion status',
        'type' => 'write',
        'ajax' => true,
    ],
];
```

---

## 4. Data Flow

### 4.1 Upload Flow (School → Central)

```
┌─────────────────────────────────────────────────────────────────┐
│ SCHOOL INSTANCE                                                  │
│                                                                  │
│  1. User Action (grade, submit, etc.)                           │
│         │                                                        │
│         ▼                                                        │
│  2. Moodle Event Triggered                                       │
│         │                                                        │
│         ▼                                                        │
│  3. Observer Captures Event ──────────────────┐                 │
│         │                                      │                 │
│         ▼                                      ▼                 │
│  4. Queue Manager                      5. File Queue            │
│     - Build payload                       (if files)            │
│     - Check duplicates                                          │
│     - Insert to queue                                           │
│         │                                                        │
│         ▼                                                        │
│  6. Scheduled Task (every 5 min)                                │
│     - Check connectivity                                        │
│     - Batch pending items                                       │
│         │                                                        │
└─────────┼───────────────────────────────────────────────────────┘
          │
          ▼ HTTPS POST
┌─────────────────────────────────────────────────────────────────┐
│ CENTRAL SERVER                                                   │
│                                                                  │
│  7. Sync API Receives Batch                                      │
│         │                                                        │
│         ▼                                                        │
│  8. Validate & Authenticate                                      │
│         │                                                        │
│         ▼                                                        │
│  9. For Each Item:                                               │
│     ├── Map school IDs to central IDs                           │
│     ├── Check for conflicts                                      │
│     ├── Apply changes                                            │
│     └── Return result                                            │
│         │                                                        │
│         ▼                                                        │
│  10. Return Results Array                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Download Flow (Central → School)

```
┌─────────────────────────────────────────────────────────────────┐
│ CENTRAL SERVER                                                   │
│                                                                  │
│  1. Admin creates/updates:                                       │
│     - Courses                                                    │
│     - Users                                                      │
│     - Enrollments                                                │
│         │                                                        │
│         ▼                                                        │
│  2. Change logged with timestamp                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
          │
          │ School requests updates (GET)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ SCHOOL INSTANCE                                                  │
│                                                                  │
│  3. Scheduled Task (every 10 min)                               │
│     - GET /syncapi/download?since=<timestamp>                   │
│         │                                                        │
│         ▼                                                        │
│  4. Update Processor                                             │
│     - Receive updates array                                      │
│     - For each update:                                           │
│       ├── Map central IDs to local IDs                          │
│       ├── Apply changes locally                                  │
│       └── Update ID mapping                                      │
│         │                                                        │
│         ▼                                                        │
│  5. Update lastdownload timestamp                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Sync Protocol

### 5.1 Message Format

#### Upload Request

```json
{
  "schoolid": "school_001",
  "timestamp": 1705234567,
  "items": [
    {
      "id": 12345,
      "eventtype": "grade",
      "eventname": "\\core\\event\\user_graded",
      "payload": {
        "event": {
          "eventname": "\\core\\event\\user_graded",
          "objecttable": "grade_grades",
          "objectid": 789,
          "relateduserid": 456,
          "courseid": 123,
          "timecreated": 1705234500
        },
        "context": {
          "user": {
            "localid": 456,
            "username": "student001",
            "email": "student@school.edu",
            "idnumber": "STU001"
          },
          "course": {
            "localid": 123,
            "shortname": "MATH101",
            "idnumber": "MATH-2024-101"
          },
          "object": {
            "table": "grade_grades",
            "localid": 789,
            "finalgrade": 85.5,
            "feedback": "Good work"
          }
        },
        "school": {
          "id": "school_001",
          "timestamp": 1705234567
        }
      },
      "priority": 1,
      "timecreated": 1705234500
    }
  ]
}
```

#### Upload Response

```json
{
  "status": "ok",
  "processed": 1,
  "results": [
    {
      "id": 12345,
      "status": "success",
      "centralid": 99999,
      "message": null
    }
  ]
}
```

#### Download Response

```json
{
  "status": "ok",
  "updates": [
    {
      "type": "user",
      "action": "create",
      "timestamp": 1705234600,
      "data": {
        "id": 5678,
        "username": "newstudent",
        "email": "new@school.edu",
        "firstname": "New",
        "lastname": "Student",
        "idnumber": "STU002"
      }
    },
    {
      "type": "enrolment",
      "action": "create",
      "timestamp": 1705234700,
      "data": {
        "userid": 5678,
        "courseid": 100,
        "status": 0,
        "timestart": 0,
        "timeend": 0
      }
    }
  ]
}
```

### 5.2 Sync States

```
┌─────────┐     Queue     ┌────────────┐     Upload      ┌────────┐
│ PENDING │──────────────▶│ PROCESSING │────────────────▶│ SYNCED │
└─────────┘               └────────────┘                 └────────┘
     ▲                          │
     │                          │ Failure (retryable)
     │                          ▼
     │    Retry < max     ┌──────────┐
     └────────────────────│  FAILED  │
                          └──────────┘
                                │
                                │ Conflict detected
                                ▼
                          ┌──────────┐
                          │ CONFLICT │
                          └──────────┘
```

---

## 6. Conflict Resolution

### 6.1 Conflict Detection

Conflicts occur when:
1. Same record modified on both central and school since last sync
2. Central ID doesn't exist for school's local ID
3. Data constraint violations

### 6.2 Resolution Strategy

| Data Type | Conflict Strategy | Rationale |
|-----------|-------------------|-----------|
| Courses | Central wins | Courses are centrally managed |
| Users | Central wins | User management is centralized |
| Enrollments | Merge (union) | Don't remove valid enrollments |
| Grades | Latest timestamp wins | Most recent grade is correct |
| Submissions | Append only | Never lose student work |
| Quiz attempts | Append only | Never lose student attempts |
| Forum posts | Append only | Never lose discussion |

### 6.3 Conflict Resolution Flow

```php
public function resolve_conflict(string $type, array $local, array $central): array {
    switch ($type) {
        case 'grade':
            // Latest timestamp wins
            if ($local['timemodified'] > $central['timemodified']) {
                return ['action' => 'use_local', 'data' => $local];
            }
            return ['action' => 'use_central', 'data' => $central];

        case 'course':
            // Central always wins
            return ['action' => 'use_central', 'data' => $central];

        case 'enrolment':
            // Merge - if either has active enrolment, keep it
            if ($local['status'] == 0 || $central['status'] == 0) {
                $merged = array_merge($central, ['status' => 0]);
                return ['action' => 'merge', 'data' => $merged];
            }
            return ['action' => 'use_central', 'data' => $central];
    }
}
```

---

## 7. ID Management

### 7.1 ID Mapping Strategy

Each school has a unique `schoolid`. Records are mapped using composite keys:

```
Central ID: 12345 (grade_grades)
     ↕
Mapping: (school_001, grade_grades, local_id=789) → central_id=12345
     ↕
Local ID: 789 (grade_grades at school_001)
```

### 7.2 ID Lookup

```php
// Finding central ID for local record
$centralid = $mapper->get_central_id('grade_grades', $localid);

// Finding local ID for central record
$localid = $mapper->get_local_id('grade_grades', $centralid);
```

### 7.3 User Matching

Users are matched by multiple identifiers (in priority order):

1. `idnumber` (if set)
2. `email`
3. `username`

### 7.4 Course Matching

Courses are matched by:

1. `idnumber` (if set)
2. `shortname`

---

## 8. Security

### 8.1 Authentication

Each school has:
- Unique `schoolid` (public identifier)
- API key (secret, stored hashed on central)

All requests are authenticated:

```php
$params = [
    'wstoken' => $this->apikey,  // School's API key
    'schoolid' => $this->schoolid,
    'wsfunction' => 'local_syncapi_upload',
    // ...
];
```

### 8.2 Authorization

- Schools can only upload their own data
- Schools can only download data intended for them
- Central server validates `schoolid` matches API key

### 8.3 Transport Security

- All sync traffic over HTTPS
- TLS 1.2+ required
- Certificate validation enabled

### 8.4 Data Validation

Central server validates all incoming data:
- Payload structure
- Data types
- ID relationships
- Permission checks (can this school modify this course?)

---

## 9. Error Handling

### 9.1 Retry Strategy

```php
$maxretries = 5;
$backoff = [60, 300, 900, 3600, 7200]; // seconds

// After each failure:
if ($item->attempts < $maxretries) {
    $item->status = 'pending';
    $item->nextretry = time() + $backoff[$item->attempts];
} else {
    $item->status = 'failed';
}
```

### 9.2 Error Categories

| Category | Retry? | Action |
|----------|--------|--------|
| Network timeout | Yes | Exponential backoff |
| Server 5xx | Yes | Exponential backoff |
| Auth failed | No | Alert admin, check config |
| Validation error | No | Mark failed, log details |
| Conflict | No | Mark conflict, manual review |

### 9.3 Dead Letter Queue

Failed items after max retries are moved to a dead letter status for manual review:

```sql
SELECT * FROM local_syncqueue_items
WHERE status = 'failed' AND attempts >= 5;
```

---

## 10. Monitoring

### 10.1 School Health Dashboard

Central server displays:
- Last sync time per school
- Queue depth per school
- Error rate per school
- Connectivity status

### 10.2 Alerts

| Condition | Alert Level | Action |
|-----------|-------------|--------|
| No sync for 24 hours | Warning | Email admin |
| No sync for 7 days | Critical | SMS alert |
| >100 failed items | Warning | Email admin |
| Sync error rate >10% | Critical | Investigate |

### 10.3 Metrics

Collected metrics:
- `sync_queue_pending` - Pending items count
- `sync_queue_failed` - Failed items count
- `sync_duration_seconds` - Sync operation duration
- `sync_items_per_batch` - Items processed per sync
- `sync_last_success` - Timestamp of last successful sync

---

## 11. Deployment

### 11.1 Central Server Setup

1. Install `local/syncapi` plugin
2. Configure school registry
3. Generate API keys for each school
4. Set up monitoring dashboard

### 11.2 School Instance Setup

Docker-based deployment:

```yaml
# docker-compose.school.yml
version: '3.8'
services:
  php:
    image: reb/moodle-php:5.1
    environment:
      - SYNCQUEUE_ENABLED=1
      - SYNCQUEUE_SCHOOLID=${SCHOOL_ID}
      - SYNCQUEUE_CENTRAL_SERVER=${CENTRAL_URL}
      - SYNCQUEUE_API_KEY=${API_KEY}
    volumes:
      - moodledata:/var/www/moodledata

  mariadb:
    image: mariadb:11.4
    volumes:
      - dbdata:/var/lib/mysql

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"

volumes:
  moodledata:
  dbdata:
```

### 11.3 Provisioning Script

```bash
#!/bin/bash
# provision-school.sh

SCHOOL_ID=$1
API_KEY=$(openssl rand -hex 32)

# Generate school-specific config
cat > .env.school <<EOF
SCHOOL_ID=${SCHOOL_ID}
CENTRAL_URL=https://moodle.reb.rw
API_KEY=${API_KEY}
EOF

# Deploy
docker compose -f docker-compose.school.yml up -d
```

---

## 12. API Reference

### 12.1 `local_syncapi_status`

Check API status and school registration.

**Request:**
```
GET /webservice/rest/server.php
?wstoken=<API_KEY>
&wsfunction=local_syncapi_status
&moodlewsrestformat=json
```

**Response:**
```json
{
  "status": "ok",
  "school": {
    "id": "school_001",
    "name": "Example School",
    "registered": true,
    "lastsync": 1705234567
  }
}
```

### 12.2 `local_syncapi_upload`

Upload queued items from school.

**Request:**
```
POST /webservice/rest/server.php
wstoken=<API_KEY>
wsfunction=local_syncapi_upload
moodlewsrestformat=json
data=<JSON_PAYLOAD>
```

**Response:**
```json
{
  "status": "ok",
  "processed": 10,
  "results": [
    {"id": 1, "status": "success"},
    {"id": 2, "status": "conflict", "message": "Grade modified on central"}
  ]
}
```

### 12.3 `local_syncapi_download`

Download updates for school.

**Request:**
```
GET /webservice/rest/server.php
?wstoken=<API_KEY>
&wsfunction=local_syncapi_download
&moodlewsrestformat=json
&schoolid=school_001
&since=1705234567
```

**Response:**
```json
{
  "status": "ok",
  "updates": [
    {
      "type": "course",
      "action": "update",
      "timestamp": 1705234600,
      "data": {...}
    }
  ]
}
```

---

## Appendix A: Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `local_syncqueue/enabled` | 0 | Enable sync queue |
| `local_syncqueue/schoolid` | '' | School identifier |
| `local_syncqueue/centralserver` | '' | Central server URL |
| `local_syncqueue/apikey` | '' | API key |
| `local_syncqueue/syncinterval` | 300 | Sync attempt interval (seconds) |
| `local_syncqueue/batchsize` | 100 | Items per batch |
| `local_syncqueue/maxretries` | 5 | Max retry attempts |

---

## Appendix B: Event Type Reference

| Event Type | Priority | Table | Sync Direction |
|------------|----------|-------|----------------|
| grade | 1 | grade_grades | ↑ |
| submission | 2 | assign_submission | ↑ |
| quiz | 1 | quiz_attempts | ↑ |
| forum | 5 | forum_posts | ↑ |
| enrol | 3 | user_enrolments | ↕ |
| completion | 4 | course_modules_completion | ↑ |
| user | 3 | user | ↕ |
| course | N/A | course | ↓ |

---

## Appendix C: Troubleshooting

### C.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Items stuck in pending | No connectivity | Check internet, run manual sync |
| Auth failed errors | Wrong API key | Regenerate API key on central |
| Conflicts piling up | Concurrent edits | Review conflict resolution |
| Files not syncing | Large files | Check file size limits |

### C.2 CLI Commands

```bash
# Check status
php local/syncqueue/cli/sync.php --status

# Test connection
php local/syncqueue/cli/sync.php --test

# Force upload
php local/syncqueue/cli/sync.php --upload --force

# Force download
php local/syncqueue/cli/sync.php --download --force
```

---

*Document End*
