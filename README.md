# Dragonbane Combat Assistant

![Version](https://img.shields.io/badge/version-2.1.2-blue)
![Foundry Version](https://img.shields.io/badge/foundry-v12%20%7C%20v13-green)
![System](https://img.shields.io/badge/system-dragonbane-orange)

## What This Module Does

**Dragonbane Combat Assistant** enhances both melee/ranged combat AND spellcasting with comprehensive validation and automation in eight powerful ways:

### ✨ **Universal Spell Support for Automated Animations (NEW in v2.0)**

- **All spells trigger animations** - Extends Automated Animations beyond just damage spells to include buffs, debuffs, utility spells, and Magic Tricks
- **Manual control options** - User-controlled buttons to enable or disable AA support as needed, disabled by default
- **Zero impact on existing spells** - Damage spells continue working exactly as before

### 🎯 **Spell Validation (NEW in v2.0)**

- **Target selection enforcement** - Range and touch spells require exactly one target, personal spells auto-target the caster
- **Smart spell range checking** - Validates spell ranges before casting
- **Template spell handling** - Template spells (cones, spheres) auto-target caster for visual effects while deferring area targeting
- **Spell exclusion setting** - Simple comma-separated list to exclude specific spells from validation while keeping animations
- **Ranged spells without a definded target** - Spells like Animal Whisperer, Gnome, etc can simply target the caster

### 🎭 **Automatic Status Effect Application (NEW in v2.0)**

- **Smart effect targeting** - Successful spells apply appropriate status effects to the correct target (self-buffs to caster, debuffs to target)
- **Dragonbane Status Effects integration** - Uses DSE module icons when available, with intelligent fallbacks
- **Template spell intelligence** - Template spells skip auto-effects (awaiting proper area targeting in future versions)
- **Effect ownership tracking** - Applied effects properly track the caster as origin for clean management

### 🎯 **Attack Validation (Enhanced)**

- **Enforces target selection** - No more accidental attacks into empty space
- **Smart weapon range validation** - Prevents impossible attacks before they happen
- **Contextual thrown weapon support** - Thrown weapons work in melee (up to 2m/4m) AND at range (up to 2x weapon range)
- **Smart distance calculation** - Handles multi-grid tokens and diagonal movement correctly
- **Melee range enforcement** - Standard melee weapons require adjacency, long weapons can reach 1 square away
- **Ranged range enforcement** - Ranged weapons can target up x2 their base range
- **Quick bypass controls** - Temporarily disable validation rules with keyboard shortcut
  - **Complete override** - Disable all validation rules at once (Alt+V)
  - **Per-user control** - Each player manages their own override state independently
  - **Foundry integration** - Fully customizable through Configure Controls menu

### 📖 **Automatic Rule Display**

- **Shows combat rules when you need them** - Only on successful special attacks
- **Covers all special actions** - Parry, Topple, Disarm, and Find Weak Spot
- **Weapon durability when parrying** - Shows weapon durability in chat for easy comparison
- **Weapon feature bonuses** - Displays topple weapon bonuses (+1 Boon) automatically
- **Mark Weapon Broken button** - Appears on parry rules for easy weapon damage tracking, updates character sheet directly from chat
- **AOE Rule Reminder (NEW in v2.0.4)** - Reminds players that AOE spells can be dodged but not parried and that targets can be exempted from AOE effects by taking a bane

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

### ⚔️ **Unforgiving Grudge Tracking**

- **Automatic damage detection** - Monitors when characters with "Unforgiving" kin ability take damage
- **Interactive grudge management** - Creates and maintains personalized grudge journals for each character
- **Smart damage correlation** - Links attack rolls to damage application for accurate tracking
- **One-click grudge addition** - "Add to Grudge List" button appears in chat for qualifying damage events
- **Detailed grudge entries** - Records attacker name, damage amount, location, date, and critical hit status
- **Journal organization** - Automatically creates organized folders and formatted grudge tables
- **Easy grudge management** - Delete buttons in journals allow removal of settled grudges
- **Critical hit indicators** - Special marking (💥) for grudges caused by critical damage
- **NOTE** - The GM will need to create the folder and Journal before Dwarf players can record grudges. Simply click the **Setup Grudge Folders for All PCs** button in settings once your Dwarf characters have been assigned to players, after that players will be able to record grudges.

### 🎲 **Year Zero Engine Combat Integration**

- **Single action tracking** - Seamless integration with YZE Combat module for action management
- **Automatic detection** - Monitors chat for combat actions using intelligent pattern matching
- **Token-specific tracking** - Each combatant tracked independently with action numbering
- **Smart exclusions** - Ignores damage rolls, healing, reaction spells, and other non-action activities
- **Override control** - Alt+V shortcut for manual control when automatic detection needs adjustment

---

## Installation

1. In Foundry VTT, go to **Add-on Modules** and click **Install Module**
2. Use this manifest URL: `https://github.com/kergalli/dragonbane-action-rules/releases/latest/download/module.json`
3. Enable the module in your world's **Manage Modules** screen

---

## Configuration

Access settings through **Configure Settings → Module Settings → Dragonbane Combat Assistant**:

### Universal Spell Support (NEW)

- **Enable Universal Spell Automated Animations** - Makes all spells compatible with Automated Animations module
- **Manual AA Enhancement Control** - User-controlled buttons to enable/disable AA support for all spells
- **Spell Exclusions** - Comma-separated list of spell names to exclude from validation (they still get animations)
- **Enable Automatic Status Effects** - Apply appropriate status effects when spells succeed

### Spell Validation (NEW)

- **Enable Spell Target Validation** - Requires target selection for range/touch spells, auto-targets caster for personal spells
- **Enable Spell Range Validation** - Validates spell casting distances before allowing the roll

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
- **Monster Action Prevention** - Interrupts disarm and parry attacks against monsters with confirmation dialog

### Encumbrance Monitoring

- **Enable Encumbrance Monitoring** - Automatically detects over-encumbered characters
- **Target Actor Folders** - Which folders to monitor (default: "Party")
- **Status Effect Settings** - Customize name, icon, and behavior of encumbrance status effects
- **Enable Chat Notifications** - Optional chat reminders about STR roll requirements

### Unforgiving Tracker

- **Enable Unforgiving Tracker** - Automatically tracks damage dealt to characters with the Unforgiving kin ability. Creates journal for grudge lists.

### YZE Integration

- **Enable YZE Integration** - Automatic action tracking with Year Zero Engine Combat module
- **YZE Action Exclusions** - Configure rolls to exclude from action tracking (see tips below), you can also exclude almost anything by UUID
- **YZE Action Inclusions - Abilities** - Specify heroic and kin abilities that should count as actions (comma-separated). Examples: Battle Cry, Berserker, Companion, Master Carpenter, Musician, Body Slam, Hunting Instincts, Raise Spirits

**Example YZE Action Exclusions (if using Token Action HUD Dragonbane):**

```
English: Death Roll, Light Test, Lantern, Oil Lamp, Tallow Candle, Torch, Severe Injury Test
Swedish: Dödsslag, Fackla, Ljustest, Lykta, Oljelampa, Svår Skada, Talgljus
```

**Example YZE Action Inclusions - Abilities:**

```
English: Battle Cry, Berserker, Companion, Master Carpenter, Musician, Body Slam, Hunting Instincts, Raise Spirits
Swedish: Bärsärk, Följeslagare, Jaktsinne, Mästersnickare, Stridsrop, Tackling, Tonkonst, Uppmuntra
```

### Advanced

- **Debug Mode** - Enable detailed console logging for troubleshooting

---

## Keyboard Shortcuts

Temporarily disable all validation rules with keyboard shortcut:

| Shortcut    | Function     | Description                                                         |
| ----------- | ------------ | ------------------------------------------------------------------- |
| **Alt + V** | Override All | Temporarily disable/enable all validation rules and action tracking |

Fully customizable through **Configure Controls** in Foundry.

---

## Special Cases & Tips

**Spell Exclusions:** Add spell names to the exclusion list (comma-separated) to skip validation while keeping animations. Example: `Protector, Heal Wound, Fireball`

**Manual AA Control:** If automatic spell enhancement causes issues, use the "Disable AA Support" button in settings, then re-enable when ready.

**Template Spells:** Template spells (Engulfing Forest, Frost, Gust of Wind) currently auto-target the caster for visual effects. Proper area targeting will be added in a future version.

**Parrying Ranged Attacks with a Weapon or Shield:** Target yourself when parrying a ranged attack with a weapon or shield. The range validation will understand you're defending at your position.

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

**Token Action HUD + YZE Integration:** If using the Token Action HUD Dragonbane module, consider adding **YZE Action Exclusions**, **YZE Action Inclusions - Abilities**, and **Excluded Spells** for better action tracking accuracy.

## Known Issues

**Template Spell Area Targeting:** Template spells currently auto-target the caster for visual effects rather than placing templates for area targeting. This is intentional for v2.0 - proper template placement will be added in v2.1.

## System Requirements & Dependencies

### Required

| Requirement           | Version | Notes                                                                           |
| --------------------- | ------- | ------------------------------------------------------------------------------- |
| **Foundry VTT**       | v12-v13 | Verified on both versions                                                       |
| **Dragonbane System** | v2.6.0+ | Required for dynamic range calculation and full functionality                   |
| **socketlib**         | Latest  | Required for automatic status effect application and cross-client communication |

### Recommended

| Module                        | Purpose               | Benefit                                                                                                 |
| ----------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| **Dragonbane Status Effects** | Enhanced status icons | Provides thematic status effect icons and visual enhancements when automatically applying spell effects |
| **Automated Animations**      | Spell animations      | Enables visual animations for all spells; without this module, Universal Spell AA Support has no effect |

### Optional Integrations

| Module                              | Purpose          | Integration Details                                                                                     |
| ----------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| **Year Zero Engine Combat**         | Action tracking  | Automatic single/multiple action tracking during combat; seamlessly integrates with YZE's action system |
| **Token Action HUD Dragonbane**     | Quick actions    | Enhanced compatibility with Token Action HUD for streamlined gameplay                                   |
| **Argon - Combat HUD (DRAGONBANE)** | Combat interface | Compatible with Argon's enhanced combat interface                                                       |

### Installation Notes

- **socketlib** is mandatory - the module will not function properly without it
- Install **Dragonbane Status Effects** before enabling automatic status effects for optimal visual experience
- **Automated Animations** should be installed and configured if you plan to use Universal Spell AA Support
- All optional integrations work independently - install only what you need

## Localization

- Full support for English and Swedish
- Language-agnostic operation using official Dragonbane translation keys

### Community Contributors

- **dgladkov** - Encumbrance fixes and distance calculations to large and huge tokens
- **xdy** - Swedish language improvements and localization fixes

## Support & Issues

- **Issues**: Report bugs at [GitHub Issues](https://github.com/kergalli/dragonbane-action-rules/issues)
- **Documentation**: Full documentation in [README.md](https://github.com/kergalli/dragonbane-action-rules/blob/main/README.md)
- **Changelog**: Version history in [CHANGELOG.md](https://github.com/kergalli/dragonbane-action-rules/blob/main/CHANGELOG.md)

## License

This module is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Disclaimer

This is an unofficial, fan-created module. Not affiliated with Free League Publishing. Dragonbane™ is a trademark of Free League Publishing.
