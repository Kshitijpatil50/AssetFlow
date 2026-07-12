# Security Specification: AssetFlow Enterprise Asset Management

## 1. Data Invariants
1. **Immutable Historical Audit Logs**: Once an ActivityLog is written, it can never be deleted or updated.
2. **Authorized Allocation Transitions**: Only an Admin, Asset Manager, or Department Head can allocate an asset or modify an allocation.
3. **Restricted Employee Upgrades**: Normal employees cannot change their own role or promote other users to Admins or Asset Managers.
4. **Isolated Personal Data**: Employees can only read notifications directed specifically to them (`recipientEmployeeId == auth.uid`).
5. **Enforced Schema Validation**: Every resource write must conform exactly to its defined schema keys and type invariants.

## 2. The "Dirty Dozen" Payloads (Malicious Writes Rejected by Rules)

1. **Self-Promotion Hack**: An employee attempts to elevate their role to `Admin`.
2. **Orphaned Asset Allocation**: Attempting to allocate an asset with a non-existent or blank asset ID.
3. **Log Modification**: Attempting to overwrite an existing activity log to cover up an unauthorized asset transfer.
4. **Log Tampering**: Attempting to delete an activity log.
5. **Unauthorized Maintenance Creation**: Creating a maintenance request on behalf of another user.
6. **Notification Snooping**: An employee attempting to read another employee's private notifications.
7. **Bypassing Allocation Limits**: Creating an allocation record without required fields (`allocatedDate`).
8. **Malicious ID Injection**: Creating a category using a 500-character, SQL-like injection string as the document ID.
9. **Asset Hijacking**: Modifying an asset status to 'Available' without having proper manager clearance.
10. **Shadow Booking Creation**: Overlapping or creating booking records with invalid date bounds or missing resources.
11. **Malicious Transfer Forgery**: Creating a transfer request that is already pre-marked as `Approved` by a non-existent admin.
12. **Audit Verdict Forgery**: Overwriting audit item check outcomes by someone not assigned as an auditor.

## 3. Test Cases Configuration (Pre-deployment Validation)

Rules will enforce these constraints natively.
