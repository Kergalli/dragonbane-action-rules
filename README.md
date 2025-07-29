# Dragonbane Combat Assistant

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![Foundry Version](https://img.shields.io/badge/foundry-v12%20%7C%20v13-green)
![System](https://img.shields.io/badge/system-dragonbane-orange)

## What This Module Does

**Dragonbane Combat Assistant** enhances melee/ranged combat and character management in three powerful ways:

### 🎯 **Attack Validation (Before Roll)**
- **Enforces target selection** - No more accidental attacks into empty space
- **Validates weapon range** - Prevents impossible attacks before they happen
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
- **Folder-based filtering** - Monitor specific actor folders (default: "Party") or all characters
- **Smart notifications** - UI notifications with optional chat reminders about STR roll requirements

## New in Version 1.2.0

### ⚖️ **Encumbrance Monitoring System**
- **Instant Response** - Detects over-encumbrance immediately when items are added/removed or actor strength changes
- **Smart Status Effects** - Automatically applies configurable status effects when characters exceed carrying capacity
- **Configurable Monitoring** - Choose which actor folder to monitor or monitor all characters
- **Rule Integration** - Optional chat notifications that remind players about STR roll requirements for over-encumbered movement

### 🎛️ **Enhanced Configuration Options**
- **Enable Encumbrance Monitoring** - Master on/off switch for the encumbrance system
- **Monitor Folder Setting** - Specify which actor folder to monitor (leave blank for all characters)
- **Custom Status Effect** - Configure the status effect name applied when over-encumbered
- **Chat Notifications** - Optional chat messages with rule reminders (disabled by default for minimal disruption)

### 🌍 **Full Internationalization Support**
- **Dynamic Language Detection** - Automatically adapts to your Dragonbane system language setting
- **Localized Combat Actions** - Recognizes combat actions in English, Swedish, and other supported languages
- **Smart Pattern Matching** - Uses official Dragonbane translation keys for accurate detection
- **English Fallback** - Ensures functionality even with unsupported languages or missing translations

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
4. **Use a special attack that succeeds** - rules will appear automatically
5. **Parry with a weapon** - see durability and the new "Mark Weapon Broken" button
6. **Use topple with a staff** - see the "+1 Boon" bonus displayed
7. **Add items to a character** - watch for automatic over-encumbrance detection

## Settings

Access via **Configure Settings → Module Settings → Dragonbane Combat Assistant**

| Setting | Default | What It Does |
|---------|---------|-------------|
| **Enable Combat Assistant** | ✅ On | Master on/off switch |
| **Enforce Target Selection** | ✅ On | Require target before attacking |
| **Enforce Range Checking** | ✅ On | Validate weapon range |
| **Show Weapon Durability** | ✅ On | Display durability for parry decisions |
| **Display Delay** | 3 seconds | How long to wait before showing rules |
| **Enable Encumbrance Monitoring** | ✅ On | Automatically monitor character encumbrance |
| **Encumbrance Monitor Folder** | "Party" | Which actor folder to monitor (blank = all characters) |
| **Encumbrance Status Effect** | "Encumbered" | Name of status effect to apply when over-encumbered |
| **Encumbrance Chat Notifications** | ❌ Off | Also create chat messages with rule reminders |
| **Debug Mode** | ❌ Off | Enable for troubleshooting |

## Special Cases

**Parrying Long Weapons:** If you're using a standard melee weapon to parry an attack from someone with a long weapon (who is 1 square away), simply target yourself when parrying. The range validation will understand you're defending at your position.

**Parrying Ranged Attacks with a Shield:** When using a shield to parry a ranged attack, simply target yourself when parrying. The range validation will understand you're defending at your position.

**Marking Weapons Broken:** The "Mark Weapon Broken" button only appears on parry rules when:
- A valid weapon was detected for the parry
- The weapon is not already broken
- You have permission to modify the weapon

## Technical Details

**Compatible With:**
- Foundry VTT v12 and v13
- Dragonbane system only
- Token Action HUD
- Argon - Combat HUD (DRAGONBANE)
- Character sheets
- All standard Dragonbane workflows
