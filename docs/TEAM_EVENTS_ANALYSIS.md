# Event Analysis - Team/Group Events for DAKSHAA 2026

## 📊 Complete Event Breakdown

Based on your database and frontend analysis, here's a comprehensive list of all events and which ones support team/group participation:

---

## ✅ TEAM/GROUP EVENTS (Events that should have `is_team_event = true`)

### 🏆 Technical Events - Team Supported (6 Events)

1. **Neura Hack (Hackathon)** - `tech-it`
   - Team Size: 2-3 Members
   - Description: 36-hour innovation marathon
   - Price: ₹100

2. **SEMISPARK (Project Presentation)** - `tech-vlsi`
   - Team Size: 1-3 Members  
   - Description: Technical project presentation competition
   - Price: ₹100

3. **ROBO SOCCER** - `tech-mct`
   - Team Size: 2-4 Members
   - Description: Robot soccer competition
   - Price: ₹100

4. **ElectroBuzz** - `tech-ece`
   - Team Size: 2-4 Members
   - Description: Electronic components sorting and circuit diagnosis
   - Price: ₹100

5. **Codathon** - `tech-aiml` or `codeathon`
   - Team Size: 1-3 Members
   - Description: Competitive coding event
   - Price: ₹100

6. **Paper Presentation** - `tech-mech`
   - Team Size: 1-3 Members
   - Description: Paper presentation competition
   - Price: ₹100

### 🎨 Cultural Events - Team Supported (2 Events)

7. **Beat Battle (Group Dance)** - `cultural-group-dance`
   - Team Size: 5-10 Members
   - Description: Synchronized group dance performance
   - Price: ₹100

8. **Short Film Competition** - `cultural-short-film`
   - Team Size: 3-8 Members
   - Description: Short film creation and presentation
   - Price: ₹150

### 🎯 Non-Technical Events - Team Supported (2 Events)

9. **Trailblazers (Clue Hunt)** - `nontech-cse`
   - Team Size: 2-3 Members
   - Description: Interactive clue hunt event
   - Price: ₹50

10. **Blind Maze Challenge** - `nontech-vlsi`
    - Team Size: 2 Members
    - Description: Blindfolded maze challenge
    - Price: ₹50

---

## ❌ INDIVIDUAL EVENTS (Keep `is_team_event = false`)

### Technical Events - Individual Only
- **Rewind & Crack** - `tech-cse` - Individual reverse coding
- **VoltEdge** - `tech-eee` - Individual event
- **Figma Fusion** - `tech-csbs` - UI/UX Design (Individual)
- **Urban Nourish** - `tech-food` - Street Food Remix
- **Designathon** - `tech-mech` - Individual design
- **WebGenesis** - `tech-it` - Web development (if not team)
- **Rapid Coding** - `tech-aids` - Individual coding
- **Cook with Prompt** - `tech-aids` - Individual AI cooking
- **Poster Presentation** - `tech-poster` - Individual
- **Project Expo** - `tech-project-expo` - Can be individual or small teams

### Cultural Events - Individual Only  
- **Musical Event** - `cultural-musical` - Solo performance
- **Instrument Performance** - `cultural-instrument` - Solo
- **Solo Dance** - `cultural-solo-dance` - Individual

### Non-Technical Events - Individual Only
- Most department non-tech events (IT, EEE, Biotech, MCT, CSBS, Food, Mech, ECE, Civil, Textile)

### Workshop Events - Individual Enrollment (NOT Team Events)
- All workshops are individual enrollment
- **Buildathon** and all other workshops: `is_team_event = false`
- Participants register individually even if they work together

---

## 🔧 CONFIGURATION STATUS

✅ **COMPLETE_TEAM_FIX.sql has been updated** to include team event configuration!

The script now:
1. ✅ Fixes infinite recursion in RLS policies
2. ✅ Adds missing columns to events and teams tables
3. ✅ Configures 10 events as team events with proper size limits
4. ✅ Ensures all workshops are individual events

---

## 📋 SUMMARY

### Total Events: ~49 events
- **Team/Group Events: 10 events** (20%)
- **Individual Events: 39 events** (80%)

### Team Events by Category:
- Technical: 6 events
- Cultural: 2 events  
- Non-Technical: 2 events
- Workshop: 0 events (all individual)

### Team Size Distribution:
- **2 members exactly**: Blind Maze Challenge (1 event)
- **2-3 members**: Neura Hack, Trailblazers (2 events)
- **1-3 members**: SEMISPARK, Codathon, Paper Presentation (3 events)
- **2-4 members**: ROBO SOCCER, ElectroBuzz (2 events)
- **5-10 members**: Beat Battle Group Dance (1 event)
- **3-8 members**: Short Film Competition (1 event)

---

## ⚡ HOW TO APPLY

### Single Script - Does Everything! 🎯

Run **[COMPLETE_TEAM_FIX.sql](../database/COMPLETE_TEAM_FIX.sql)** in Supabase SQL Editor.

This ONE script will:
1. ✅ Add missing columns to events table (title, is_team_event, etc.)
2. ✅ Add missing columns to teams table (max_members, leader_id)
3. ✅ Fix infinite recursion error in RLS policies
4. ✅ Configure 10 events as team events with proper sizes
5. ✅ Set all workshops as individual events

### Steps:
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy **ALL** contents from `database/COMPLETE_TEAM_FIX.sql`
3. Paste and click **RUN**
4. Verify you see: "✅ ALL FIXES APPLIED SUCCESSFULLY!"
5. **Refresh your frontend**

### After Running:
✅ Team creation works without errors  
✅ Students can create teams for 10 eligible events  
✅ Team creation modal shows only team-enabled events  
✅ Proper team size limits enforced per event  
✅ Dashboard shows "My Teams" section  

---

## 🎯 TEAM EVENTS THAT WILL APPEAR IN CREATION MODAL

When students click "Create Team" in their dashboard, they'll see:

**Technical Events (6):**
- Neura Hack (2-3 members) - ₹100
- SEMISPARK Project (1-3 members) - ₹100
- ROBO SOCCER (2-4 members) - ₹100
- ElectroBuzz (2-4 members) - ₹100
- Codathon (1-3 members) - ₹100
- Paper Presentation (1-3 members) - ₹100

**Cultural Events (2):**
- Beat Battle Group Dance (5-10 members) - ₹100
- Short Film Competition (3-8 members) - ₹150

**Non-Technical Events (2):**
- Trailblazers Clue Hunt (2-3 members) - ₹50
- Blind Maze Challenge (2 members) - ₹50

---

**Generated:** January 3, 2026  
**Status:** Ready for database update
