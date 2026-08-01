# Plan: Phalanx Mobile (Expo & React Native)

## Overview
Transitioning Phalanx from a web-based proof-of-concept to a native mobile application using **Expo** and **React Native**. The app focuses on a seamless onboarding experience, AI-powered food logging, and personalized workout tracking.

---

## Architecture & Tech Stack

- **Framework**: Expo (React Native) with Expo Router for navigation.
- **Authentication**: Supabase Auth (Email/Password, Google/Apple Sign-in).
- **Database**: Supabase PostgreSQL (User profiles, food logs, workout plans).
- **Storage**: 
  - **Remote**: Supabase Storage (Food photos).
  - **Local**: `AsyncStorage` (To track onboarding completion and cache user session).
- **AI Integration**: Gemini/OpenAi LLM API (Vision) for converting food photos into macro data. OpenAI chat bot
- **External APIs**: USDA Food Data Central / OpenFoodFacts (for search/barcode).

---

## User Onboarding (First-Launch)

1. **Oauth (Sign-in/Sign-up):**
  - User creates an account via Supabase Auth.
2. **Paywall (IAP)**
  - Check if is_paid is true in Supabase.
  - If false, show a Paywall screen for a **$4.99/mo subscription.**
  - Integration via **Expo-In-App-Purchases.**
3. **Information Form**: 
   - Fields: Age, Weight, Height, Gender, Activity Level, Fitness Goal (Lose/Maintain/Gain).
   - Button: **"Begin"** (replaces "Calculate").
4. **Data Persistence**:
   - Calculate TDEE, BMR, BMI, and Macros immediately.
   - Save these metrics to the `user_profiles` table in **Supabase**.
   - **Subscription Cache**: Set a flag `is_paid: true` in **AsyncStorage** upon successful payment to avoid paywall flickering on launch.
   - **Onboarding Flag**: Set a flag `hasCompletedOnboarding: true` in **AsyncStorage**.
   - **Background Validation**: On every app launch, re-validate the subscription status with the store (via Expo-IAP) in the background to update both the local cache and the Supabase `user_profiles` table.
   - If existing users tries to log in from another device and uses the same **Authentication** then, `hasCompletedOnboarding: true` and skips the onboarding form
5. **Flow**: If the flag exists in `AsyncStorage`, the app skips this form and goes directly to the Main Tabs.

---

## App Structure (Three-Tab Navigation)

### Tab 1: Food Logger (The "Cal AI" Experience)
- **Daily Dashboard**: 
  - **Circular Progress**: Large central visual for "Calories Remaining" surrounded by smaller circular or semi-circular gauges for Protein, Carbs, and Fat.
  - **Timeline**: A chronological list of food logs (e.g., "Chicken Breast - 12:00 PM") with caloric breakdown for each entry.
- **Logging Tools**:
  - **Search**: Text-based lookup of nutrition data.
  - **Barcode Scanner**: Camera-based lookup.
  - **AI Photo Log**: Take a photo -> Gemini API analyzes image -> **Review & Edit Screen** (User confirms/adjusts identified foods and macros) -> Save.
- **Persistence**: Every entry is synced to Supabase `diary_entries`.

### Tab 2: Workout
- **Weekly Split View**: Displays the full recommended workout split for the week (e.g., Mon: Push, Tue: Pull, etc.) based on the onboarding data.
- **Routine Details**: Users can tap into a day to see exercises, rep ranges, and rest periods as defined in `personalization-workout.md`.
- **Logic**: Training frequency and intensity adjust based on the user's Activity Level and Goal.

### Tab 3: Calculator / Profile
- **Re-evaluation**: Users can update their weight, height, or goals.
- **Recalculation**: Triggers a macro update that updates the Supabase profile and future diary goals.
- **Settings**: App preferences, account management, and logout.

---

## Database Schema Updates (Supabase)

```sql
-- Profiles table to store user metrics and subscription status
CREATE TABLE user_profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  age int,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  activity_level numeric,
  fitness_goal text,
  tdee numeric,
  bmr numeric,
  macros_json jsonb, -- {p: 150, c: 200, f: 60}
  is_paid boolean DEFAULT false,
  subscription_status text DEFAULT 'inactive', -- 'active', 'trialing', 'canceled', 'past_due'
  updated_at timestamptz DEFAULT now()
);

-- Diary entries (same as web plan, but with AI metadata)
CREATE TABLE diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  food_name text NOT NULL,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  photo_url text,
  is_ai_generated boolean DEFAULT false
);
```

---

## Questions

**What is Mock AsyncStorage?**
- "Mocking" is a testing technique where you create a simulated version of a part of your app to see how the rest of the code reacts.

  In the case of Mocking AsyncStorage, it means we "force" the app to think specific data is already there without actually having to go through the whole
  sign-up or payment process. For example:

   1. To test the Paid experience: We tell the mock: "When the app asks for 'is_paid', return true." Then we check if the app correctly skips the paywall and
      goes to the form.
   2. To test the New User experience: We tell the mock: "Return null for everything." Then we verify the app correctly shows the login and paywall screens.
   3. To test the "New Phone" scenario: We clear the mock storage but keep the Supabase database record as is_paid: true. This lets us verify that your
      "Background Validation" logic correctly restores the local cache from the database.

It allows us to test every possible user state (Paid, Unpaid, Expired, Canceled) in seconds without using a real credit card or a real phone.

In a production environment:

   1. The Mock is removed: You use the real AsyncStorage library, which talks to the phone's actual disk.
   2. Real Transactions: You use the real Apple/Google payment servers.
   3. Real Database: You use your live Supabase instance.