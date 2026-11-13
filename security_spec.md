# Security Specification — Al-Madar Classifieds

## 1. Data Invariants
1. **Listing Ownership & Identity**: A listing's `ownerId` must match `request.auth.uid` on creation and can never be modified afterward.
2. **PII Isolation**: No phone numbers, email addresses, or private user fields exist on `/listings/{listingId}`. Private user contact details reside strictly in `/users/{userId}/private/{docId}` readable only by `userId == request.auth.uid`.
3. **Referential Integrity on Inquiries**: An inquiry cannot exist without an existing `/listings/{listingId}` whose `ownerId` matches `inquiry.sellerId`. A buyer cannot send an inquiry to themselves (`buyerId != sellerId`) or spoof `buyerId`.
4. **Terminal State Locking**: Once an inquiry reaches `status == 'closed'`, neither buyer nor seller can mutate it further.
5. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` on creation; `createdAt` is immutable on update and `updatedAt` must equal `request.time`.
6. **Query Enforcement (`allow list`)**: No blanket `list` rules and zero `get()`/`exists()` calls inside `allow list`. Public listing queries only return `status == 'active'` or documents owned by the caller; inquiry queries only return documents where caller is `buyerId` or `sellerId`.

## 2. Dirty Dozen Attack Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Listing Create**: Unauthenticated POST to `/listings/test1` -> DENIED (`request.auth != null`).
2. **Owner Spoofing**: Authenticated user A creates `/listings/ad1` with `ownerId: "userB"` -> DENIED (`incoming().ownerId == request.auth.uid`).
3. **Shadow Field Injection**: User A creates `/listings/ad2` with extra field `isFeatured: true` -> DENIED (`keys().hasOnly(...)`).
4. **Invalid Document ID Poisoning**: User A creates `/listings/bad$id..slash` -> DENIED (`isValidId(listingId)`).
5. **Client Timestamp Forgery**: User A creates `/listings/ad3` with backdated `createdAt` -> DENIED (`createdAt == request.time`).
6. **Non-Owner Listing Update**: User B updates User A's listing title -> DENIED (`existing().ownerId == request.auth.uid`).
7. **Immutable Field Tampering**: User A updates `ownerId` or `createdAt` on own listing -> DENIED.
8. **Type/Boundary Poisoning**: User A updates `price` to `-500` or `title` to 500 chars -> DENIED (`isValidListing()`).
9. **Public Paused/Sold Scrape**: Unauthenticated `list` query without `status == 'active'` filter -> DENIED (`resource.data.status == 'active'`).
10. **Cross-User PII Read**: User B reads `/users/userA/private/profile` -> DENIED (`request.auth.uid == userId`).
11. **Orphaned / Spoofed Seller Inquiry**: User B creates inquiry pointing to non-existent `listingId` or mismatched `sellerId` -> DENIED (`get(...)` parent verification).
12. **Closed Inquiry Reopen**: Seller updates an inquiry whose `existing().status == 'closed'` -> DENIED (terminal state lock).
