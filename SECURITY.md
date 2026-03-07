# Security Policy

## Supported Versions

Currently, only the main / active production deployment is supported with security updates.

## Reporting a Vulnerability

If you discover a security vulnerability within EduZambia, please send an e-mail to `security@eduzambia.zm`. All security vulnerabilities will be promptly addressed. Please **do not** open public issues for security vulnerabilities.

## The Five Security Layers of Multi-Tenancy

We take data isolation seriously. A single school's data will never leak to another. This is enforced by five boundaries:

1. **Authentication Scope:** At login, Context Auth maps an identity rigorously to a specific `schoolId`. A user token explicitly belongs to one tenant context.
2. **Convex Middleware (`withSchoolScope`):** Every standard database mutation/query executes through a wrapper validating that data records matched belong to the user's `schoolId`.
3. **Feature Flags:** Accessing logic bounded for unavailable features (e.g. `BOARDING`) will instantly reject requests at the server level via the `requireFeature` boundary.
4. **Role Permission Matrix:** Composable Roles define the extent of modifications possible. `requirePermission` strictly halts unapproved operations regardless of frontend visibility.
5. **UI Guards:** React Layout Shells utilize `FeatureGuard` and `PermissionGuard` components natively preventing client-side unauthenticated views and rendering operations.
