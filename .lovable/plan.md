

# Telegram Mini App — Ultimate Monetization Hub
## Full UI Prototype + Working Backend (Phase 1)

### Overview
A mobile-first earning platform with a premium dark glassmorphism design, featuring 5 main tabs: Home, Earn, Airdrop, Wallet, and Profile. Built with React + Tailwind + Supabase, compatible with both Telegram Mini Apps and standalone web use.

---

### Design System
- **Dark mode default** with deep navy/black backgrounds
- **Glassmorphism** cards and bottom nav (frosted glass effect, subtle borders)
- **Gradient accents** (purple-to-blue, cyan-to-green for earnings)
- **Smooth page transitions** and micro-animations
- **Mobile-first** layout (max-width ~430px centered)

---

### Bottom Navigation (5 Tabs)
🏠 Home | 💰 Earn | 🎁 Airdrop | 👛 Wallet | 👤 Profile

---

### Screens & Features

#### 🏠 Home
- Welcome banner with user stats (balance, streak, level)
- Daily streak tracker with progress bar
- Quick action cards (Spin Wheel, Mystery Box, Daily Bonus)
- Activity feed / announcements
- FOMO elements: limited offers countdown, milestone progress

#### 💰 Earn
- **Tabs**: Tasks | Shortlinks | Ads
- **Tasks**: Offerwall-style list (social tasks, app installs, surveys) with reward amounts, status badges, and category filters. Daily/limited task indicators.
- **Shortlinks**: List of shortlink buttons with timer countdown after click, reward on completion
- **Ads**: Watch ad for reward cards with cooldown timers
- Each task shows: title, reward amount, type badge, verification status

#### 🎁 Airdrop
- Token earning progress bar
- Activity-based token accumulation display
- Claim button with scheduled distribution info
- Airdrop leaderboard
- Token allocation breakdown

#### 👛 Wallet (Phantom-style)
- **Main balance** display with glassmorphism card
- **Multi-currency view**: Coins, Points, App Token with balances
- **Token list** with icons and balances
- **Transaction history** with filters
- **Actions**: Deposit, Withdraw, Convert/Swap
- **Deposit modal**: crypto address display, QR code placeholder
- **Withdraw modal**: method selection (Crypto/USDT/Binance ID), amount input, fee display
- **Swap modal**: internal currency conversion with exchange rates

#### 👤 Profile
- User avatar, username, level/rank
- Referral section: unique invite link, copy button, share options
- Referral stats: total referrals, 3-level breakdown, earnings from referrals
- Referral leaderboard
- Settings: language, notifications
- Withdrawal history

#### 🎰 Gamification Modals
- **Spin Wheel**: animated wheel with prize segments
- **Mystery Box**: open animation with random reward
- **Daily Bonus**: consecutive day rewards grid

---

### Admin Dashboard (separate `/admin` route)
- **Overview**: revenue stats, user count, active users chart
- **User Management**: user list with search, balance editing, ban/unban
- **Task Management**: CRUD for tasks, reward configuration
- **Ad Management**: ad network code injection (Monetag, Adsterra fields)
- **Token Control**: supply management, price setting, exchange rates
- **Withdrawal Queue**: pending withdrawals with approve/reject
- **Referral Settings**: level percentages configuration
- **System Settings**: maintenance mode toggle, currency creation
- **Logs**: activity log viewer

---

### Backend (Supabase)
- **Auth**: Email + Telegram user ID support
- **Database Tables**: users/profiles, tasks, user_tasks, referrals, transactions, currencies, airdrops, admin settings, withdrawal_requests, activity_logs
- **User Roles**: admin role table with RLS policies (security-first approach)
- **Edge Functions**: referral tracking, reward distribution, withdrawal processing, exchange rate calculations
- **RLS Policies**: users see only their own data, admins have full access via `has_role()` function

---

### Telegram Integration
- Telegram Web App SDK initialization (detect if running inside Telegram)
- Use Telegram user data when available (name, user ID)
- Haptic feedback on actions
- Back button handling
- Fallback to regular web auth when not in Telegram

---

### Implementation Order
1. Design system, layout shell, and bottom navigation
2. Home screen with gamification elements
3. Earn screen (tasks, shortlinks, ads)
4. Wallet screen (Phantom-style)
5. Airdrop screen
6. Profile & referral system
7. Supabase backend setup (auth, tables, RLS)
8. Admin dashboard
9. Telegram SDK integration
10. Gamification modals (spin wheel, mystery box)

