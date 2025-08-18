# Dragonbane Combat Assistant

![Version](https://img.shields.io/badge/version-1.3.4-blue)
![Foundry Version](https://img.shields.io/badge/foundry-v12%20%7C%20v13-green)
![System](https://img.shields.io/badge/system-dragonbane-orange)

## What This Module Does

**Dragonbane Combat Assistant** enhances melee/ranged combat and character management in five powerful ways:

### 🎯 **Attack Validation (Before Roll)**
- **Enforces target selection** - No more accidental attacks into empty space
- **Smart weapon range validation** - Prevents impossible attacks before they happen
- **Contextual thrown weapon support** - Thrown weapons work in melee (up to 2m/4m) AND at range (up to 2x weapon range)
- **Smart distance calculation** - Handles multi-grid tokens and diagonal movement correctly
- **Melee range enforcement** - Standard melee weapons require adjacency, long weapons can reach 1 square away
- **Ranged range enforcement** - Ranged weapons can target up x2 their base range
- **Quick bypass controls** - Temporarily disable validation rules with keyboard shortcuts
  - **Individual toggles** - Override target selection (Alt+T) or range checking (Alt+R) separately
  - **Complete override** - Disable all validation rules at once (Alt+A)
  - **Easy reset** - Clear all overrides instantly (Alt+X)
  - **Per-user control** - Each player manages their own override state independently
  - **Foundry integration** - Fully customizable through Configure Controls menu

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

### ⚡ **Year Zero Engine Integration**
- **Seamless action tracking** - Works with YZE Combat module for single action mode
- **Automatic status effects** - Applies action markers when characters act in combat
- **Smart detection** - Recognizes weapon attacks, spells, skills, and monster attacks
- **Reaction handling** - Excludes reaction spells from action tracking
- **Customizable exclusions** - Configure which dice rolls to ignore
- **Override support** - Temporarily disable action tracking with Alt+Y for edge cases

## New in Version 1.3.3 / 1.3.4

### 🛠️ **Critical YZE Integration Bug Fixes**
- **Non-Combat Token Fix** - Resolved issue where tokens not in combat were incorrectly receiving "action already performed" messages
- **Damage Roll Fix** - Fixed double action detection where damage rolls were incorrectly treated as separate actions
- **Improved Detection** - Enhanced YZE integration logic to properly distinguish between combatants, non-combatants, and damage rolls

### 🔧 **Technical Improvements**
- **Smarter Combatant Detection** - YZE integration now properly verifies if actors are actually in the current combat
- **Reliable Damage Roll Detection** - Uses CSS classes and data attributes to accurately identify damage/healing rolls
- **Better Action Workflow** - Attack → Damage button workflow now correctly applies only one action status effect

---

## New in Version 1.3.2

### ⚡ **YZE Action Tracking Override (Alt+Y)**
- **Edge Case Handling** - Temporarily disable automatic YZE action status effect application
- **Manual Control** - Handle situations where rolls are incorrectly detected as actions
- **Test Roll Support** - Prevent test rolls from consuming action slots
- **Session-Only** - Override automatically clears when Foundry reloads

### 📊 **Override Status Display (Alt+S)**  
- **Personal Status Check** - Show your current override status via notification
- **Clean Display** - Shows only active overrides or "All validation rules active"
- **No Chat Clutter** - Personal notifications that don't affect other players
- **Quick Reference** - Instant feedback on what validation rules are currently bypassed

### 🔧 **Enhanced Override System**
- **Expanded "All Overrides"** - Alt+A now includes YZE action tracking in addition to validation rules
- **Complete Reset** - Alt+X clears all override types including the new YZE override
- **Improved Console Commands** - Enhanced debugging and manual testing capabilities

### 🛠️ **Bug Fixes**
- **Fixed "Mark Weapon Broken" Button** - Resolved timing issues that prevented the button from working
- **Improved Error Handling** - Better module initialization and hook management

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
11. **Install YZE Combat module** - enable single action mode for automatic action tracking
12. **Use keyboard shortcuts** - press Alt+T to temporarily disable target enforcement, Alt+R for range checking
13. **Check your override status** - press Alt+S to see which validation rules are currently bypassed
14. **Handle YZE edge cases** - press Alt+Y to temporarily disable action tracking for test rolls

## Keyboard Shortcuts

The module provides convenient keyboard shortcuts for temporarily overriding validation rules during gameplay:

| Shortcut | Function | Description |
|----------|----------|-------------|
| **Alt + T** | Toggle Target Override | Temporarily disable/enable target selection enforcement |
| **Alt + R** | Toggle Range Override | Temporarily disable/enable weapon range validation |
| **Alt + Y** | Toggle YZE Override | Temporarily disable/enable automatic YZE action tracking |
| **Alt + S** | Show Override Status | Display current override status via personal notification |
| **Alt + A** | Override All | Temporarily disable/enable all validation rules and action tracking |
| **Alt + X** | Reset All | Clear all temporary overrides |

## Settings

Access via **Configure Settings → Module Settings → Dragonbane Combat Assistant**

| Setting | Default | What It Does |
|---------|---------|-------------|
| **Enable Combat Assistant** | ✅ On | Master on/off switch |
| **Enforce Target Selection** | ✅ On | Require target before attacking (can be overridden with Alt+T) |
| **Enforce Range Checking** | ✅ On | Validate weapon range (can be overridden with Alt+R) |
| **Display Delay** | 3 seconds | How long to wait before showing rules |
| **Show Weapon Durability** | ✅ On | Display durability for parry decisions |
| **OPTIONAL RULE: Enable Shove Rule Reminders** | ✅ On | Show shove reminders when STR advantage allows it |
| **OPTIONAL RULE: Enable Parry Movement Reminders** | ✅ On | Show optional parry movement rule |
| **Enable Dodge Movement Reminders** | ✅ On | Show EVADE movement reminders |
| **Enable Encumbrance Monitoring** | ✅ On | Automatically monitor character encumbrance |
| **Encumbrance Monitor Folder** | "Party" | Which actor folder to monitor (blank = all characters) |
| **Encumbrance Status Effect** | "Encumbered" | Name of status effect to apply when over-encumbered |
| **Encumbrance Chat Notifications** | ❌ Off | Also create chat messages with rule reminders |
| **Enable Year Zero Engine Integration** | ✅ On | Integrate with YZE Combat module for action tracking (can be overridden with Alt+Y) |
| **YZE Action Exclusions** | "" | Additional words/phrases to exclude from action tracking |
| **Debug Mode** | ❌ Off | Enable for troubleshooting |

## Special Cases

**Thrown Weapons:** The module automatically detects weapons with the "Thrown" feature and validates them contextually:
- **Close Range (≤2m normal, ≤4m long)**: Validates as melee weapon
- **Far Range (>2m/4m)**: Validates as ranged weapon up to 2x base range
- **Examples**: Dagger at 1m = melee ✅, Dagger at 8m = thrown ✅, Dagger at 25m = blocked ❌

**Year Zero Engine Integration:** When YZE Combat module is installed with single action mode enabled:
- **Automatic Detection**: Recognizes all types of actions from chat messages
- **Action Tracking**: Applies appropriate action status effects automatically
- **Reaction Exclusions**: Reaction spells don't count as actions
- **Multiple Actions**: Handles characters with multiple action slots correctly
- **Override Support**: Use Alt+Y to temporarily disable action tracking for edge cases

**Override System:** Each player manages their own validation overrides independently:
- **Personal Control**: Your overrides only affect your own client
- **Status Checking**: Use Alt+S to see which overrides are currently active
- **Edge Case Handling**: Use Alt+Y to prevent test rolls from consuming YZE action slots
- **Session-Only**: All overrides automatically clear when Foundry reloads

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

## Known Issues

**Thrown Weapons vs Large Tokens:** In the core Dragonbane module, thrown weapons measure distance to a single reference grid square (upper left) instead of using token bounds. This causes attacks with thrown weapons against large and huge tokens to default to the Throw dialog when attacking from anywhere not adjacent to the upper left grid square of the enemy. This is a limitation of the core system's distance calculation and is outside the scope of this module to fix. **NOTE: This should be fixed in the next version of the core Draognbane system.**

## Technical Details

**Compatible With:**
- Foundry VTT v12 and v13
- Dragonbane system only
- Token Action HUD
- Argon - Combat HUD (DRAGONBANE)
- Year Zero Engine Combat module
- Dragonbane Character Sheet
