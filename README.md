# Dragonbane Combat Assistant

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![Foundry Version](https://img.shields.io/badge/foundry-v12%20%7C%20v13-green)
![System](https://img.shields.io/badge/system-dragonbane-orange)

## What This Module Does

**Dragonbane Combat Assistant** enhances melee/ranged combat in two powerful ways:

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

## Why You Need This

**Stop These Common Problems:**
- ❌ Forgetting to select a target before attacking
- ❌ Trying to attack enemies too far away
- ❌ Having to look up special attack rules while combat waits
- ❌ Forgetting weapon durability when parrying
- ❌ Manually tracking broken weapons on character sheets

**Get These Benefits:**
- ✅ **Faster combat** - Less rule lookups and invalid attempts
- ✅ **Fewer mistakes** - Validation prevents common errors
- ✅ **More immersion** - Rules and bonuses appear automatically when needed
- ✅ **Better weapon tracking** - Interactive buttons for weapon management

## New in Version 1.1.0

### 🆕 **Interactive Weapon Management**
When you successfully parry, a "Mark Weapon Broken" button appears below the rules if your weapon could be damaged. Click it to:
- Mark the weapon as broken on your character sheet
- Get confirmation dialog to prevent accidents

### 🆕 **Enhanced Weapon Feature Display**
Topple attacks now show weapon bonuses at the top of the rules:
- **Staff Topple Feature: +1 Boon** - Know your tactical advantages
- Automatically detects weapons with "Toppling" feature

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

1. **Install and enable** the module
2. **No additional setup required** - it works immediately
3. **Try attacking without a target** - you'll see the validation in action
4. **Use a special attack that succeeds** - rules will appear automatically
5. **Parry with a weapon** - see durability and the new "Mark Weapon Broken" button
6. **Use topple with a staff** - see the "+1 Boon" bonus displayed

## Settings

Access via **Configure Settings → Module Settings → Dragonbane Combat Assistant**

| Setting | Default | What It Does |
|---------|---------|-------------|
| **Enable Combat Assistant** | ✅ On | Master on/off switch |
| **Enforce Target Selection** | ✅ On | Require target before attacking |
| **Enforce Range Checking** | ✅ On | Validate weapon range |
| **Show Weapon Durability** | ✅ On | Display durability for parry decisions |
| **Display Delay** | 3 seconds | How long to wait before showing rules |
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

**Range Calculation:**
- **Melee weapons**: Adjacent squares only (0-2m)
- **Long melee weapons**: Adjacent + 1 square away (0-4m) 
- **Ranged weapons**: Up to 2× weapon base range
- **Multi-grid tokens**: Properly calculated edge-to-edge distance
