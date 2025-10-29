#!/bin/bash

# Script to create user document for existing user via Firebase CLI
# This is a one-time fix for users who signed up before the Cloud Function was deployed

USER_ID="PEVTqUVMPzSTmTETWXi1Bzkvx5D2"
USER_EMAIL="nourkhaleds1223@gmail.com"
USER_NAME="Nour Khaled"
USER_ROLE="admin"  # Change to 'frontend' or 'backend' if needed

echo "🚀 Creating user document in Firestore..."
echo "User ID: $USER_ID"
echo "Email: $USER_EMAIL"
echo "Role: $USER_ROLE"
echo ""

# Use Firebase CLI to create the document
firebase firestore:delete "users/$USER_ID" --force 2>/dev/null
firebase firestore:set "users/$USER_ID" --data "{\"id\": \"$USER_ID\", \"email\": \"$USER_EMAIL\", \"fullName\": \"$USER_NAME\", \"role\": \"$USER_ROLE\", \"createdAt\": \"TIMESTAMP\"}"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ User document created successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Refresh your browser (F5)"
    echo "2. Sign out and sign in again"
    echo "3. You should now have full access!"
else
    echo ""
    echo "❌ Failed to create user document"
    echo "Please use Firebase Console instead:"
    echo "https://console.firebase.google.com/project/studio-6017697584-aeed8/firestore"
fi
