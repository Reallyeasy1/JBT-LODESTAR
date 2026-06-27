# PR Review Checklist

Apply every category to every PR. Skip a category only if it has zero surface area in the diff (e.g. no DB code → skip Migrations).

---

## 1. Correctness Bugs
- Logic errors, wrong conditions, off-by-one, null/undefined dereference
- Incorrect return values or side effects
- Incorrect use of async/await (missing await, uncaught promise rejection)
- Wrong variable captured in closure or loop
- Mutation of shared state without intent

## 2. Edge Cases
- Empty input, zero, negative numbers, empty arrays, null/undefined
- Boundary values (max length, max int, date boundaries)
- Concurrent access to the same resource
- Network failure, timeout, partial response
- Unexpected but valid input that the code doesn't handle

## 3. Security Risks
- Injection: SQL, command, template, XSS, path traversal
- Secrets or credentials in code, logs, or error messages
- Insecure defaults (debug mode on, weak crypto, open CORS)
- Prototype pollution, ReDoS, unsafe deserialization
- Sensitive data in URLs, logs, or client-side storage

## 4. Auth / AuthZ Issues
- Missing authentication check on route or function
- Authorization bypass (accessing another user's resource)
- Privilege escalation path
- Insecure direct object reference (IDOR)
- Missing rate limiting on auth endpoints

## 5. Data Consistency
- Write without transaction where atomicity is required
- Read-modify-write without pessimistic or optimistic lock
- Cascade delete or update missing where expected
- Stale cache returned after mutation
- Inconsistent state if partial failure occurs mid-operation

## 6. Race Conditions
- Non-atomic check-then-act
- Shared mutable state accessed from concurrent goroutines/async functions
- Event listener registered multiple times
- setTimeout/setInterval firing after component unmount

## 7. Migrations
- Destructive migration (drop column/table) without data backup or rollback plan
- Adding NOT NULL column without default on populated table
- Migration that locks the table for long duration in production
- Missing index on new foreign key
- Migration not idempotent (fails on second run)

## 8. API Breaking Changes
- Removed or renamed field from public response
- Changed field type in response
- Added required field to request
- Changed HTTP method or URL for existing endpoint
- Changed error codes or error shape

## 9. Performance Issues
- N+1 query (loop that issues a query per iteration)
- Missing index on frequently-queried column
- Fetching more data than needed (SELECT *)
- Synchronous expensive work on the main thread
- Unbound result set (no LIMIT on query)

## 10. Observability Gaps
- New error path with no log
- Sensitive data logged that shouldn't be
- Missing metrics/tracing on new service call
- Swallowed error (catch with no re-throw or log)
- No structured context on error (just a string message)

## 11. Missing Tests
- New function/branch with no test
- Changed behaviour with no updated test
- Error path untested
- Edge case identified above with no test

## 12. Maintainability
- Function doing more than one thing (hard to name)
- Duplication of business logic across files
- Magic numbers/strings with no explanation
- Inconsistency with existing patterns in the same file/module
- Dead code introduced or left in
