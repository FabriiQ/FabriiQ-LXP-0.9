# Leaderboard API Documentation

## Overview

The Leaderboard API provides access to the leaderboard system's functionality, allowing you to retrieve leaderboard data, manage leaderboard configurations, and interact with the points system. This document outlines the available endpoints, request/response formats, and includes examples for common use cases.

## Base URL

All API endpoints are relative to the base URL:

```
/api/trpc
```

## Authentication

All API requests require authentication. Include the authentication token in the request headers:

```
Authorization: Bearer <token>
```

## Common Parameters

Many endpoints support the following common parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | Time period for leaderboard data (daily, weekly, monthly, term, all_time) |
| `limit` | number | Maximum number of entries to return |
| `offset` | number | Number of entries to skip (for pagination) |

## Endpoints

### Get Class Leaderboard

Retrieves the leaderboard for a specific class.

**Endpoint:** `leaderboard.getClassLeaderboard`

**Method:** `POST`

**Request Body:**

```json
{
  "classId": "class_123",
  "period": "weekly",
  "limit": 10,
  "offset": 0
}
```

**Response:**

```json
{
  "data": [
    {
      "studentId": "student_456",
      "studentName": "John Doe",
      "rank": 1,
      "points": 1250,
      "previousRank": 2,
      "level": 5,
      "achievements": 8
    },
    // Additional entries...
  ],
  "totalStudents": 25
}
```

### Get Subject Leaderboard

Retrieves the leaderboard for a specific subject.

**Endpoint:** `leaderboard.getSubjectLeaderboard`

**Method:** `POST`

**Request Body:**

```json
{
  "subjectId": "subject_123",
  "period": "monthly",
  "limit": 10,
  "offset": 0
}
```

**Response:**

```json
{
  "data": [
    {
      "studentId": "student_789",
      "studentName": "Jane Smith",
      "rank": 1,
      "points": 980,
      "previousRank": 1,
      "level": 4,
      "achievements": 6
    },
    // Additional entries...
  ],
  "totalStudents": 30
}
```

### Get Campus Leaderboard

Retrieves the leaderboard for an entire campus.

**Endpoint:** `leaderboard.getCampusLeaderboard`

**Method:** `POST`

**Request Body:**

```json
{
  "campusId": "campus_123",
  "period": "term",
  "limit": 20,
  "offset": 0
}
```

**Response:**

```json
{
  "data": [
    // Leaderboard entries...
  ],
  "totalStudents": 150
}
```

### Get Student Rank

Retrieves a specific student's rank in a leaderboard.

**Endpoint:** `leaderboard.getStudentRank`

**Method:** `POST`

**Request Body:**

```json
{
  "studentId": "student_456",
  "type": "class",
  "referenceId": "class_123",
  "period": "weekly"
}
```

**Response:**

```json
{
  "rank": 5,
  "totalStudents": 25,
  "points": 850,
  "previousRank": 7,
  "percentile": 80
}
```

### Get Leaderboard History

Retrieves historical leaderboard data for trend analysis.

**Endpoint:** `leaderboard.getLeaderboardHistory`

**Method:** `POST`

**Request Body:**

```json
{
  "type": "class",
  "referenceId": "class_123",
  "startDate": "2023-01-01",
  "endDate": "2023-03-31",
  "limit": 10
}
```

**Response:**

```json
{
  "snapshots": [
    {
      "date": "2023-03-31",
      "entries": [
        // Leaderboard entries...
      ]
    },
    {
      "date": "2023-02-28",
      "entries": [
        // Leaderboard entries...
      ]
    },
    // Additional snapshots...
  ]
}
```

### Get Leaderboard Configuration

Retrieves the current configuration for a leaderboard.

**Endpoint:** `leaderboard.getConfiguration`

**Method:** `POST`

**Request Body:**

```json
{
  "type": "class",
  "referenceId": "class_123"
}
```

**Response:**

```json
{
  "visibleColumns": ["rank", "studentName", "points", "level"],
  "enabledPeriods": ["daily", "weekly", "monthly", "all_time"],
  "defaultPeriod": "weekly",
  "showRankChange": true,
  "enableAnimations": true,
  "partitioning": {
    "demographic": false,
    "custom": []
  }
}
```

### Update Leaderboard Configuration

Updates the configuration for a leaderboard.

**Endpoint:** `leaderboard.updateConfiguration`

**Method:** `POST`

**Request Body:**

```json
{
  "type": "class",
  "referenceId": "class_123",
  "config": {
    "visibleColumns": ["rank", "studentName", "points", "achievements"],
    "enabledPeriods": ["weekly", "monthly", "all_time"],
    "defaultPeriod": "monthly",
    "showRankChange": true,
    "enableAnimations": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Configuration updated successfully"
}
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Class not found",
    "details": {
      "classId": "class_123"
    }
  }
}
```

Common error codes:

- `BAD_REQUEST`: Invalid request parameters
- `NOT_FOUND`: Requested resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_SERVER_ERROR`: Server-side error

## Rate Limiting

API requests are subject to rate limiting:

- 100 requests per minute per user
- 1000 requests per hour per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

## Webhooks

The API supports webhooks for real-time notifications of leaderboard changes:

**Registration Endpoint:** `leaderboard.registerWebhook`

**Method:** `POST`

**Request Body:**

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["rank_change", "new_leader", "milestone_reached"],
  "secret": "your_webhook_secret"
}
```

**Webhook Payload Example:**

```json
{
  "event": "rank_change",
  "timestamp": "2023-04-15T14:30:00Z",
  "data": {
    "studentId": "student_456",
    "leaderboardType": "class",
    "referenceId": "class_123",
    "oldRank": 5,
    "newRank": 3
  }
}
```
