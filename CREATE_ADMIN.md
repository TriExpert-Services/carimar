# Creating an Admin User for CARIMAR Services

This guide explains how to create an administrator account for your CARIMAR Services application.

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Register as a Normal User
1. Go to your application
2. Click "Sign Up" or "Register"
3. Create an account with your email and password
4. Complete the registration process

### Step 2: Promote User to Admin via Supabase Dashboard
1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Table Editor** in the left sidebar
4. Select the **users** table
5. Find your newly created user
6. Click on the user row to edit it
7. Change the **role** field from `client` to `admin`
8. Save the changes

### Step 3: Access Admin Dashboard
1. Log out of your application
2. Log back in with your admin credentials
3. You should now see the Admin Dashboard instead of the Client Dashboard

---

## Method 2: Using SQL Query

If you prefer to use SQL, follow these steps:

### Step 1: Register as a Normal User
1. Go to your application and register with your desired admin email
2. Complete the registration process

### Step 2: Run SQL Query
1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Run the following SQL query (replace the email with your actual email):

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

### Step 3: Verify Admin Status
Run this query to verify the user is now an admin:

```sql
SELECT id, email, role, nombre
FROM users
WHERE email = 'your-admin-email@example.com';
```

You should see `role` set to `admin`.

### Step 4: Access Admin Dashboard
1. Log out of your application
2. Log back in with your admin credentials
3. You should now see the Admin Dashboard

---

## Admin vs Client Differences

### Client Dashboard Features:
- View their own quotes
- View their own bookings
- Submit new quote requests
- View payment status

### Admin Dashboard Features:
- View all quotes from all users
- Approve or reject quote requests
- View all bookings
- See monthly revenue statistics
- View all registered clients
- Manage pending quotes
- Access comprehensive analytics

---

## Troubleshooting

### Issue: Still seeing Client Dashboard after promoting to admin
**Solution:**
1. Log out completely from the application
2. Clear your browser cache/cookies
3. Log back in

### Issue: Cannot find user in users table
**Solution:**
1. Make sure you completed the registration process
2. Check the **auth.users** table in Supabase - if the user exists there but not in the **users** table, there may be an RLS policy issue
3. Try registering again

### Issue: SQL query returns no rows
**Solution:**
1. Double-check the email address (it's case-sensitive)
2. Make sure the user completed registration successfully
3. Check if the user exists in the **users** table

---

## Security Notes

- **Keep admin credentials secure** - Don't share them
- **Use a strong password** for admin accounts
- **Limit the number of admin users** - Only create admin accounts for trusted personnel
- **Regularly audit admin actions** by checking the database logs

---

## Multiple Admin Users

You can create multiple admin users by repeating the process above for each user:

1. Have each person register as a normal user
2. Promote each one to admin using either method
3. Each admin will have full access to the Admin Dashboard

---

## Need Help?

If you encounter any issues creating an admin user:

1. Check the Supabase logs for any errors
2. Verify that the database migrations ran successfully
3. Ensure Row Level Security policies are properly configured
4. Contact your development team for assistance
