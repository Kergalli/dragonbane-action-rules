# Dragonbane Combat Assistant

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Foundry Version](https://img.shields.io/badge/foundry-v12%20%7C%20v13-green)
![System](https://img.shields.io/badge/system-dragonbane-orange)

## What This Module Does

**Dragonbane Combat Assistant** enhances tactical combat in two powerful ways:

### 🎯 **Attack Validation**
- **Enforces target selection** - No more accidental attacks into empty space
- **Validates weapon range** - Prevents impossible attacks before they happen
- **Smart distance calculation** - Handles multi-grid tokens and diagonal movement correctly
- **Melee range enforcement** - Standard melee weapons require adjacency, long weapons can reach 1 square away

### 📖 **Automatic Rule Display** 
- **Shows combat rules when you need them** - Only on successful special attacks
- **Covers all special actions** - Parry, Topple, Disarm, and Find Weak Spot
- **Weapon durability when parrying** - Shows weapon durability in chat for easy comparison

## Why You Need This

**Stop These Common Problems:**
- ❌ Forgetting to select a target before attacking
- ❌ Trying to attack enemies too far away
- ❌ Having to look up special attack rules while combat waits
- ❌ Wait! What is my weapon's durability?

**Get These Benefits:**
- ✅ **Faster combat** - Less rule lookups and invalid attempts
- ✅ **Better tactics** - Make informed parrying decisions with durability info
- ✅ **Fewer mistakes** - Validation prevents common errors
- ✅ **More immersion** - Rules appear automatically when needed

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

## Technical Details

**Compatible With:**
- Foundry VTT v12 and v13
- Dragonbane system only
- Token Action HUD
- Argon - Combat HUD (DRAGONBANE)
- Character sheets
- All standard Dragonbane workflows

**Performance:**
- Minimal resource usage
- Only processes combat-related chat messages
- No persistent data stored

**Range Calculation:**
- **Melee weapons**: Adjacent squares only (0-2m)
- **Long melee weapons**: Adjacent + 1 square away (0-4m) 
- **Ranged weapons**: Up to 2× weapon base range
- **Multi-grid tokens**: Properly calculated edge-to-edge distance

## Troubleshooting

**Still getting blocked when you shouldn't be?**
- Check if target selection and range checking are both enabled in settings
- Try enabling debug mode to see what's happening in the console
- Make sure you have a token selected and a valid target
- For parrying attacks at range, target yourself instead of the attacker
