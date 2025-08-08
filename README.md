# Dragonbane Combat Assistant

![Version](https://img.shields.io/badge/version-1.2.4-blue)
![Foundry Version](https://img.shields.io/badge/foundry-v12%20%7C%20v13-green)
![System](https://img.shields.io/badge/system-dragonbane-orange)

## What This Module Does

**Dragonbane Combat Assistant** enhances melee/ranged combat and character management in four powerful ways:

### 🎯 **Attack Validation (Before Roll)**
- **Enforces target selection** - No more accidental attacks into empty space
- **Smart weapon range validation** - Prevents impossible attacks before they happen
- **Contextual thrown weapon support** - Thrown weapons work in melee (up to 2m/4m) AND at range (up to 2x weapon range)
- **Smart distance calculation** - Handles multi-grid tokens and diagonal movement correctly
- **Melee range enforcement** - Standard melee weapons require adjacency, long weapons can reach 1 square away
- **Ranged range enforcement** - Ranged weapons can target up x2 their base range

### 📖 **Automatic Rule Display** 
- **Shows combat rules when you need them** - Only on successful special attacks
- **Covers all special actions** - Parry, Topple, Disarm, and Find Weak Spot
- **Weapon durability when parrying** - Shows weapon durability in chat for easy comparison
- **Weapon feature bonuses** - Displays topple weapon bonuses (+1 Boon) automatically
- **Mark Weapon Broken button** - Appears on parry rules for easy weapon damage tracking, updates character sheet directly from chat

### ⚖️ **Encumbrance Monitoring**
- **Event-driven monitoring** - Instantly detects when characters become over-encumbered
- **Automatic status effects** - Applies configurable status effects when carrying too many items
- **Smart status effect creation** - Automatically creates custom status effects if they don't exist in the game
- **Folder-based filtering** - Monitor specific actor folders (default: "Party") or all characters
- **Smart notifications** - UI notifications with optional chat reminders about STR roll requirements

### 🏃 **Optional Rule Reminders**
- **Shove mechanics** - Contextual reminders when STR damage bonus allows shoving targets 2m during damage-dealing attacks
- **Parry movement** - Optional reminders about the 2m movement option on successful parries
- **Dodge movement** - Helpful reminders about dodge movement options on successful EVADE rolls
- **Intelligent conditions** - Only shows when rules actually apply (right weapon types, STR advantages, etc.)

## New in Version 1.2.4

### 🗡️ **Thrown Weapon Support**
- **Contextual Range Validation** - Thrown weapons (daggers, spears, handaxes, etc.) now work correctly at both melee and ranged distances
- **Smart Weapon Detection** - Automatically detects weapons with "Thrown" feature using proper Dragonbane localization
- **Melee + Ranged Capability** - Thrown weapons validate as melee when close (≤2m normal, ≤4m long) and as ranged when farther
- **Shove Rule Integration** - Thrown weapons can trigger shove reminders when used in melee combat

### 🔬 **Pattern-Based Detection System for Shove Special Rules**
- **Reliability** - Completely rebuilt shove detection using chat message content analysis
- **Language Agnostic** - Uses Dragonbane's own translation keys to work in English, Swedish, and future languages
- **✅ Shove Allowed:** Normal attacks, Stab, Slash, Find Weak Spot (damage-dealing melee)
- **❌ Shove Excluded:** Topple, Disarm (no damage), Parry (defensive), Ranged attacks, Spells

## Installation

### From Foundry Module Browser
1. Open Foundry VTT
2. Go to **Add-on Modules**
3. Click **Install Module**
4. Search for **"Dragonbane Combat Assistant"**
5. Click **Install**

### Manual Installation
Use this manifest URL in Foundry's Install Module dialog:
`https://github.com/kergalli/dragonbane-action-rules/releases/latest/download/module.json`

## Quick Start

1. **Install and enable** module
2. **No additional setup required** - it works immediately
3. **Try attacking without a target** - you'll see the validation in action
4. **Try a thrown weapon at different distances** - see contextual validation
5. **Use a special attack that succeeds** - rules will appear automatically
6. **Parry with a weapon** - see durability and the new "Mark Weapon Broken" button
7. **Use topple with a staff** - see the "+1 Boon" bonus displayed
8. **Add items to a character** - watch for automatic over-encumbrance detection
9. **Try a successful EVADE roll** - see the movement reminder
10. **Use Weakspot with STR advantage** - see the shove option appear

## Settings

Access via **Configure Settings → Module Settings → Dragonbane Combat Assistant**

| Setting | Default | What It Does |
|---------|---------|-------------|
| **Enable Combat Assistant** | ✅ On | Master on/off switch |
| **Enforce Target Selection** | ✅ On | Require target before attacking |
| **Enforce Range Checking** | ✅ On | Validate weapon range (includes thrown weapon support) |
| **Display Delay** | 3 seconds | How long to wait before showing rules |
| **Show Weapon Durability** | ✅ On | Display durability for parry decisions |
| **OPTIONAL RULE: Enable Shove Rule Reminders** | ✅ On | Show shove reminders when STR advantage allows it |
| **OPTIONAL RULE: Enable Parry Movement Reminders** | ✅ On | Show optional parry movement rule |
| **Enable Dodge Movement Reminders** | ✅ On | Show EVADE movement reminders |
| **Enable Encumbrance Monitoring** | ✅ On | Automatically monitor character encumbrance |
| **Encumbrance Monitor Folder** | "Party" | Which actor folder to monitor (blank = all characters) |
| **Encumbrance Status Effect** | "Encumbered" | Name of status effect to apply when over-encumbered |
| **Encumbrance Chat Notifications** | ❌ Off | Also create chat messages with rule reminders |
| **Debug Mode** | ❌ Off | Enable for troubleshooting |

## Special Cases

**Thrown Weapons:** The module automatically detects weapons with the "Thrown" feature and validates them contextually:
- **Close Range (≤2m normal, ≤4m long)**: Validates as melee weapon
- **Far Range (>2m/4m)**: Validates as ranged weapon up to 2x base range
- **Examples**: Dagger at 1m = melee ✅, Dagger at 8m = thrown ✅, Dagger at 25m = blocked ❌

**Parrying Long Weapons:** If you're using a standard melee weapon to parry an attack from someone with a long weapon (who is 1 square away), simply target yourself when parrying. The range validation will understand you're defending at your position.

**Parrying Ranged Attacks with a Shield:** When using a shield to parry a ranged attack, simply target yourself when parrying. The range validation will understand you're defending at your position.

**Marking Weapons Broken:** The "Mark Weapon Broken" button only appears on parry rules when:
- A valid weapon was detected for the parry
- The weapon is not already broken
- You have permission to modify the weapon

**Shove Conditions:** Shove reminders only appear when:
- Using a melee weapon or thrown weapon in melee range
- Attack deals damage (excludes Topple/Disarm)
- Attacker is not a monster
- Target is not a monster  
- Attacker's STR damage bonus ≥ target's STR damage bonus

## Technical Details

**Compatible With:**
- Foundry VTT v12 and v13
- Dragonbane system only
- Token Action HUD
- Argon - Combat HUD (DRAGONBANE)
- Dragonbane Character Sheet
