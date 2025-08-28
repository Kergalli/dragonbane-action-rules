# Dragonbane Combat Assistant

![Version](https://img.shields.io/badge/version-1.3.9-blue)
![Foundry Version](https://img.shields.io/badge/foundry-v12%20%7C%20v13-green)
![System](https://img.shields.io/badge/system-dragonbane-orange)

## What This Module Does

**Dragonbane Combat Assistant** enhances melee/ranged combat and character management in six powerful ways:

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

### 🛡️ **Monster Action Prevention**
- **Pre-roll confirmation dialogs** - Intercepts Parry and Disarm attempts against monsters before the roll happens
- **Educational approach** - Informs players about rules with clear dialog messages before they attempt invalid actions
- **Prevents invalid advancement** - Blocks the roll entirely when user cancels, avoiding skill advancement on impossible actions
- **Smart bypass for edge cases** - Allows exceptions when user clicks "Proceed" for rare situations where rules permit

### ⚖️ **Encumbrance Monitoring**
- **Event-driven monitoring** - Instantly detects when characters become over-encumbered
- **Automatic status effects** - Applies configurable status effects when carrying too many items
- **Smart status effect creation** - Automatically creates custom status effects if they don't exist in the game
- **Enhanced compatibility** - Works seamlessly with the Dragonbane Status Effects module (uses existing "Over-Encumbered" effect if available)
- **Folder-based filtering** - Monitor specific actor folders (default: "Party") or all characters
- **Smart notifications** - UI notifications with optional chat reminders about STR roll requirements

### 🎲 **Year Zero Engine Combat Integration**
- **Single action tracking** - Seamless integration with YZE Combat module for action management
- **Automatic detection** - Monitors chat for combat actions using intelligent pattern matching
- **Contextual notifications** - Different messages for Player Characters vs NPCs/Monsters
- **Token-specific tracking** - Each combatant tracked independently with action numbering
- **Smart exclusions** - Ignores damage rolls, healing, and other non-action activities
- **Override control** - Alt+Y shortcut for manual control when automatic detection needs adjustment

### 🃏 **Optional Rule Reminders**
- **Shove mechanics** - Contextual reminders when STR damage bonus allows shoving targets 2m during damage-dealing attacks
- **Parry movement** - Optional reminders about the 2m movement option on successful parries
- **Dodge movement** - Helpful reminders about dodge movement options on successful EVADE rolls
- **Intelligent conditions** - Only shows when rules actually apply (right weapon types, STR advantages, etc.)

---

## Installation

1. In Foundry VTT, go to **Add-on Modules** and click **Install Module**
2. Use this manifest URL: `https://github.com/kergalli/dragonbane-action-rules/releases/latest/download/module.json`
3. Enable the module in your world's **Manage Modules** screen

---

## Configuration

Access settings through **Configure Settings → Module Settings → Dragonbane Combat Assistant**:

### Attack Validation
- **Enable Target Selection Enforcement** - Requires target selection for all attacks
- **Enable Range Checking** - Validates weapon ranges before allowing attacks

### Rules Display  
- **Display Delay** - How long rules stay visible (0-10 seconds)
- **Show Weapon Durability on Parry** - Displays weapon durability for parrying weapons

### Optional Rule Reminders
- **Enable Shove Reminders** - Shows shove opportunities when conditions are met
- **Enable Parry Movement Reminders** - Shows movement options on successful parries  
- **Enable Dodge Movement Reminders** - Shows movement options on successful EVADE rolls

### Encumbrance Monitoring
- **Enable Encumbrance Monitoring** - Automatically detects over-encumbered characters
- **Target Actor Folders** - Which folders to monitor (default: "Party")
- **Status Effect Settings** - Customize name, icon, and behavior of encumbrance status effects
- **Enable Chat Notifications** - Optional chat reminders about STR roll requirements

### YZE Integration
- **Enable YZE Integration** - Automatic action tracking with Year Zero Engine Combat module
- **YZE Action Exclusions** - Configure rolls to exclude from action tracking (see tips below)

### Advanced
- **Debug Mode** - Enable detailed console logging for troubleshooting

---

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

All shortcuts can be customized through **Configure Controls** in Foundry.

---

## Usage Examples

### Attack Validation
- **Target Required**: Attempting to attack without a target shows warning and prevents the roll
- **Range Checking**: Attacking beyond weapon range shows distance violation and suggests valid targets
- **Thrown Weapons**: Automatically detects context - uses melee range when adjacent, thrown range when distant

### Rules Display
When you successfully parry, topple, disarm, or find a weak spot, the relevant rules appear automatically with:
- Clear rule descriptions and mechanical effects
- Weapon durability (for parries) to compare against attacker's damage
- "Mark Weapon Broken" button for easy weapon damage tracking
- Weapon feature bonuses (e.g., "+1 Boon for Toppling weapons")

### Monster Action Prevention
- **Attempting Disarm on Monster**: Dialog appears explaining "Monsters cannot be disarmed. Are you sure you want to attempt this disarm against [Monster Name]?"
- **User Options**: Click "Cancel" to prevent the roll entirely, or "Proceed" to allow the action for edge cases
- **Clean Flow**: Single dialog → decision → complete action without additional interruptions

### Encumbrance Monitoring
- Automatically applies customizable status effects when characters exceed carry capacity
- Provides immediate notifications when encumbrance status changes
- Optional chat reminders about required STR rolls for over-encumbered characters
- Works seamlessly with Dragonbane Status Effects module if installed

### YZE Integration  
- **First Action**: Character makes an attack → automatically applies "Single Action" status effect
- **Subsequent Actions**: Additional attacks show contextual notifications and apply "Multiple Actions" effect
- **Smart Detection**: Ignores damage rolls, healing, and advancement - only tracks actual combat actions

## Special Cases & Tips

**Parrying Ranged Attacks with a Weapon:** Target yourself when parrying a ranged attack with a weapon (not shield). The range validation will understand you're defending at your position.

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

**Monster Action Prevention:** Prevention dialogs only appear for Parry and Disarm attempts against monsters. All other actions proceed normally.

**Token Action HUD + YZE Integration:** If using the Token Action HUD Dragonbane module, consider adding these exclusions to **YZE Action Exclusions** setting for better action tracking accuracy:
```
Death Roll, Light Test, Lantern Test, Oil Lamp Test, Candle Test, Torch Test, Severe Injury Test
```

## Known Issues

**Thrown Weapons vs Large Tokens:** In the core Dragonbane module, thrown weapons measure distance to a single reference grid square (upper left) instead of using token bounds. This causes attacks with thrown weapons against large and huge tokens to default to the Throw dialog when attacking from anywhere not adjacent to the upper left grid square of the enemy. This is a limitation of the core system's distance calculation and is outside the scope of this module to fix. **NOTE: This should be fixed in the next version of the core Dragonbane system.**

## Technical Details

**Compatible With:**
- Foundry VTT v12 and v13
- Dragonbane system only
- Token Action HUD
- Argon - Combat HUD (DRAGONBANE)
- Year Zero Engine Combat module
- Dragonbane Character Sheet
- Dragonbane Status Effects module

**Localization:**
- Full support for English and Swedish
- Dynamic pattern generation based on current Dragonbane system language
- Language-agnostic operation using official Dragonbane translation keys

## Support & Issues

- **Issues**: Report bugs at [GitHub Issues](https://github.com/kergalli/dragonbane-action-rules/issues)
- **Documentation**: Full documentation in [README.md](https://github.com/kergalli/dragonbane-action-rules/blob/main/README.md)
- **Changelog**: Version history in [CHANGELOG.md](https://github.com/kergalli/dragonbane-action-rules/blob/main/CHANGELOG.md)

## License

This module is licensed under the MIT License. See [LICENSE](LICENSE) for details.
