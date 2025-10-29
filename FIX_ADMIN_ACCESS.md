# Fix User Access - Quick Guide

## Problem
User `nourkhaleds1223@gmail.com` (ID: `PEVTqUVMPzSTmTETWXi1Bzkvx5D2`) cannot access the app because their user document doesn't exist in Firestore.

## Solution: Create User Document via Firebase Console

### Step 1: Open Firebase Console
Go to: https://console.firebase.google.com/project/studio-6017697584-aeed8/firestore

### Step 2: Create the Document
1. Click on "Start collection" or go to the `users` collection
2. Click "Add document"
3. Set **Document ID** to: `PEVTqUVMPzSTmTETWXi1Bzkvx5D2`

### Step 3: Add Fields
Add these fields exactly:

| Field Name | Type | Value |
|------------|------|-------|
| `id` | string | `PEVTqUVMPzSTmTETWXi1Bzkvx5D2` |
| `email` | string | `nourkhaleds1223@gmail.com` |
| `fullName` | string | `Nour Khaled` |
| `role` | string | `frontend` |
| `createdAt` | timestamp | (Click "timestamp" and use current time) |

### Step 4: Save
Click "Save" button.

### Step 5: Refresh Browser
1. Go back to your app
2. Refresh the page (F5 or Ctrl+R)
3. Or sign out and sign in again
4. You should now be able to access the app as a regular user!

---

## What This Does
- Creates user profile in Firestore
- Sets role to `frontend` (regular user)
- Allows the user to:
  - View their personal data
  - Request leaves
  - View their own attendance records
  - View their own deductions
  - Chat with the team

## Future Users
New users who sign up will automatically get their documents created by the Cloud Function that was deployed. This manual step is only needed for your existing account.
