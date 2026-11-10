# Setup guide: Supabase + GitHub + Vercel

Total time: about 30 minutes. Everything here is free.
Button names in Supabase, GitHub and Vercel change now and then. If a label does not match, look for the closest one, or tell me what you see.

You will do five things:
1. Make the database (Supabase)
2. Create your admin login
3. Connect the site to the database
4. Put the site online (GitHub + Vercel)
5. Keep the database awake

---

## Part 1: Make the database

1. Go to **supabase.com** and sign up (GitHub login is easiest).
2. Click **New project**.
   - Name: `portfolio`
   - Database password: click **Generate**, then **save it in a password manager**. You will rarely need it, but you cannot see it again.
   - Region: pick the closest to Bangladesh (Southeast Asia, Singapore).
   - Click **Create new project** and wait 1 to 2 minutes.
3. In the left menu open **SQL Editor** and click **New query**.
4. Open `schema.sql` from this folder, copy everything, paste it in, and click **Run**.
   - Expected: "Success. No rows returned".
5. Open **Table Editor**. You should see a table named `entries` with a small lock/shield icon showing security is on.

## Part 2: Create your admin login (and block everyone else)

1. Left menu: **Authentication**, then **Users**, then **Add user**, then **Create new user**.
2. Enter your email and a strong password. **Tick "Auto Confirm User".** Click **Create user**.
3. **Turn off public sign-ups** so nobody else can ever create an account:
   - Authentication, then **Sign In / Providers** (may be called **Settings**).
   - Switch **off** "Allow new users to sign up".
   - Click **Save**.
4. Check: the **Users** list should show only you.

## Part 3: Connect the site to the database

1. In Supabase open **Project Settings**, then **API Keys**. (The **Connect** button at the top of the project also shows them.)
2. Copy two things:
   - **Project URL**: looks like `https://abcdxyz.supabase.co`
   - **Publishable key**: starts with `sb_publishable_`
3. Open `config.js` and paste them between the quotes.
4. **Safety rule:** never paste anything that starts with `sb_secret_` or `service_role` into any file of this site. The publishable key is meant to be public. The secret key is not.

## Part 4: Put the site online

**GitHub**
1. Sign in at github.com. Click **New repository**. Name it `portfolio`. Keep it **Public** (the keep-alive in Part 5 works best that way). Click **Create**.
2. Click **uploading an existing file** and drag in **everything in this folder**, including the `assets` folder and the hidden `.github` folder (on Mac press Cmd+Shift+. to see hidden folders; on Windows tick "Hidden items" in File Explorer).
3. Click **Commit changes**.

**Vercel**
1. Go to **vercel.com** and sign up with GitHub.
2. Click **Add New**, then **Project**, and **Import** your `portfolio` repo.
3. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
4. Click **Deploy**. When it finishes, open the link Vercel gives you.

## Part 5: Keep the database awake

Free Supabase projects pause after about a week with no activity. A small scheduled job in this repo pings the database every 3 days.

1. In GitHub open your repo, then **Settings**, then **Secrets and variables**, then **Actions**, then **New repository secret**. Add two secrets:
   - Name `SUPABASE_URL`, value: your Project URL
   - Name `SUPABASE_KEY`, value: your publishable key
2. Open the **Actions** tab. If asked, click **I understand my workflows, go ahead and enable them**.
3. Click **Keep Supabase awake**, then **Run workflow**. Expected: a green tick after a few seconds.
4. Know this: GitHub switches off scheduled jobs in a repo with **no activity for 60 days**. Set a calendar reminder every 2 months to open the Actions tab and re-enable it if needed.

---

## First login

1. Your admin address is your site address plus `/arj-studio-7k2q.html`.
   Example: `https://your-site.vercel.app/arj-studio-7k2q.html`
2. Sign in with the email and password from Part 2.
3. Open **Tools** and click **Import starter content**. This copies the sample projects, article and idea into the database. It does nothing if content already exists.
4. Now add, edit and delete from the Projects, Articles and Ideas tabs.

## Changing the secret address

The address is just the file name. To change it: rename `arj-studio-7k2q.html` to anything you like (for example `my-hq-93x.html`) and upload the new name to GitHub, deleting the old one. No other file refers to it.

## What actually protects your admin

- The secret address only hides the page. It is **not** security. Do not rely on it.
- The real protection is **the login** plus the **database rules in schema.sql**. Even if someone finds the page, they cannot read hidden entries or change anything without your password.
- Use a long, unique password. Never share the admin address in public.
