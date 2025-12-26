# Dragonbane Combat Assistant

![Version](https://img.shields.io/badge/version-2.2.4-blue)
![Foundry Version](https://img.shields.io/badge/foundry-v12%20%7C%20v13-green)
![System](https://img.shields.io/badge/system-dragonbane-orange)

**Dragonbane Combat Assistant** enhances combat and spellcasting with comprehensive validation, automation, and smart integrations for the Dragonbane RPG system.

---

## 🚀 **Installation**

1. In Foundry VTT: **Add-on Modules** → **Install Module**
2. Manifest URL: `https://github.com/kergalli/dragonbane-action-rules/releases/latest/download/module.json`
3. Enable in **Manage Modules**

---

## ✨ **Key Features**

### 🪄 **Universal Spell Support & Validation**

- **All spells trigger Automated Animations** - Extends AA beyond damage spells to include buffs, debuffs, utility spells, and Magic Tricks
- **Smart targeting enforcement** - Range and touch spells require exactly one target, personal spells auto-target the caster
- **Intelligent range checking** - Validates spell casting distances before allowing the roll
- **Automatic status effects** - Successful spells apply appropriate status effects to correct targets (self-buffs to caster, debuffs to target)
- **Template spell handling** - Template spells (cones, spheres) auto-target caster for visual effects while deferring area targeting
- **Spell exclusion system** - Simple comma-separated list to exclude specific spells from validation while keeping animations
- **Manual control options** - User-controlled buttons to enable/disable AA support as needed (disabled by default)

### ⚔️ **Combat Validation & Enhancement**

- **Target selection enforcement** - Prevents accidental attacks into empty space
- **Smart weapon range validation** - Prevents impossible attacks before they happen
- **Contextual thrown weapon support** - Thrown weapons work in melee (up to 2m/4m) AND at range (up to 2x weapon range)
- **Smart distance calculation** - Handles multi-grid tokens and diagonal movement correctly
- **Melee range enforcement** - Standard melee weapons require adjacency, long weapons can reach 1 square away
- **Ranged range enforcement** - Ranged weapons can target up to 2x their base range

### 🛡️ **Monster Action Prevention**

- **Pre-roll confirmation dialogs** - Intercepts Parry and Disarm attempts against monsters before the roll happens
- **Educational approach** - Informs players about rules with clear dialog messages before they attempt invalid actions
- **Prevents invalid advancement** - Blocks the roll entirely when user cancels, avoiding skill advancement on impossible actions
- **Smart bypass for edge cases** - Allows exceptions when user clicks "Proceed" for rare situations where rules permit

### 📖 **Automatic Rule Display**

- **Shows combat rules when you need them** - Only on successful special attacks (Parry, Topple, Disarm, Find Weak Spot)
- **Weapon durability when parrying** - Shows weapon durability in chat for easy comparison
- **Weapon feature bonuses** - Displays topple weapon bonuses (+1 Boon) automatically
- **Mark Weapon Broken button** - Appears on parry rules for easy weapon damage tracking, updates character sheet directly from chat
- **AOE Rule Reminder** - Reminds players that AOE spells can be dodged but not parried and that targets can be exempted from AOE effects by taking a bane

### 🎯 **Year Zero Engine Combat Integration**

- **Single action tracking** - Seamless integration with YZE Combat module for action management
- **Automatic detection** - Monitors chat for combat actions using intelligent pattern matching
- **Token-specific tracking** - Each combatant tracked independently with action numbering
- **Smart exclusions** - Ignores damage rolls, healing, reaction spells, attribute tests, table rolls, and other non-action activities
- **Token Action HUD integration** - Automatically excludes utility rolls from Token Action HUD Dragonbane v2.4.1+
- **Override control** - Alt+V shortcut for manual control when automatic detection needs adjustment

### 🛡️ **Character Monitoring Systems**

#### **Encumbrance Monitoring**

- **Event-driven monitoring** - Instantly detects when characters become over-encumbered
- **Comprehensive change detection** - Monitors coins, item equip/unequip, item addition/removal, quantity changes, STR attribute changes
- **Automatic status effects** - Applies configurable status effects when carrying too many items
- **Folder-based filtering** - Monitor specific actor folders (default: "Party") or all characters
- **Smart notifications** - UI notifications with optional chat reminders about STR roll requirements

#### **Unforgiving Grudge Tracking**

- **Automatic damage detection** - Monitors when characters with "Unforgiving" kin ability take damage
- **Interactive grudge management** - Creates and maintains personalized grudge journals for each character
- **Smart damage correlation** - Links attack rolls to damage application for accurate tracking
- **One-click grudge addition** - "Add to Grudge List" button appears in chat for qualifying damage events
- **Detailed grudge entries** - Records attacker name, damage amount, location, date, and critical hit status
- **Journal organization** - Automatically creates organized folders and formatted grudge tables
- **⚠️ GM Setup Required** - Click "Setup Grudge Folders for All PCs" in settings after assigning Dwarf characters to players

#### **Custom Weapon Features**

- **House rule support** - Add custom weapon features via comma-separated list for tracking campaign-specific properties
- **Tracking only** - Features appear in weapon checkboxes but don't implement mechanical effects automatically

---

## ⚙️ **Configuration**

**Access**: Game Settings → Configure Settings → Dragonbane Combat Assistant

### **Universal Spell Support**

- **Enable Universal Spell Automated Animations** - Makes all spells compatible with Automated Animations module
- **Manual AA Enhancement Control** - User-controlled buttons to enable/disable AA support for all spells
- **Spell Exclusions** - Comma-separated list of spell names to exclude from validation (they still get animations)
- **Enable Automatic Status Effects** - Apply appropriate status effects when spells succeed

### **Spell Validation**

- **Enable Spell Target Validation** - Requires target selection for range/touch spells, auto-targets caster for personal spells
- **Enable Spell Range Validation** - Validates spell casting distances before allowing the roll

### **Attack Validation**

- **Enable Target Selection Enforcement** - Requires target selection for all attacks
- **Enable Range Checking** - Validates weapon ranges before allowing attacks

### **Rules Display**

- **Display Delay** - How long rules stay visible (0-10 seconds)
- **Show Weapon Durability on Parry** - Displays weapon durability for parrying weapons
- **Monster Action Prevention** - Interrupts disarm and parry attacks against monsters with confirmation dialog

### **Optional Rule Reminders**

- **Enable Shove Reminders** - Shows shove opportunities when conditions are met
- **Enable Parry Movement Reminders** - Shows movement options on successful parries
- **Enable Dodge Movement Reminders** - Shows movement options on successful EVADE rolls

### **Character Monitoring**

- **Enable Encumbrance Monitoring** - Automatically detects over-encumbered characters
- **Target Actor Folders** - Which folders to monitor (default: "Party")
- **Status Effect Settings** - Customize name, icon, and behavior of encumbrance status effects
- **Enable Unforgiving Tracker** - Automatically tracks damage dealt to characters with the Unforgiving kin ability

### **Custom Features**

- **Custom Weapon Features** - Add house rule or campaign-specific weapon properties via comma-separated list

**Example Custom Features:**

```
English: Articulated, Heavy, Small, Vampiric, Wounding
Swedish: Ledad, Tung, Liten, Sårande, Vampyrisk
```

### **YZE Integration**

- **Enable YZE Integration** - Automatic action tracking with Year Zero Engine Combat module
- **YZE Action Exclusions** - Configure additional rolls to exclude from action tracking (for custom content only)
- **YZE Action Inclusions - Abilities** - Specify heroic and kin abilities that should count as actions

**🆕 Automatic Token Action HUD Integration:**

When using Token Action HUD Dragonbane v2.4.1+, these are **automatically excluded** without configuration:

- **Fear Tests** - WIL resistance rolls and Fear Effect table rolls
- **Light Tests** - Light source duration tests
- **Death Rolls** - CON survival tests
- **Severe Injury Tests** - CON survival tests

**Example YZE Action Exclusions (for manual/custom exclusions only):**

```
English: Custom Ritual, Special Investigation, Unique Ability Name
Swedish: Specialundersökning, Unik Förmåga
```

**Example YZE Action Inclusions - Abilities:**

```
English: Battle Cry, Berserker, Companion, Master Carpenter, Musician, Body Slam, Hunting Instincts, Raise Spirits
Swedish: Bärsärk, Följeslagare, Jaktsinne, Mästersnickare, Stridsrop, Tackling, Tonkonst, Uppmuntra
```

### **Advanced**

- **Debug Mode** - Enable detailed console logging for troubleshooting

---

## 🎮 **Usage & Special Cases**

### **Keyboard Shortcuts**

| Shortcut    | Function     | Description                                                         |
| ----------- | ------------ | ------------------------------------------------------------------- |
| **Alt + V** | Override All | Temporarily disable/enable all validation rules and action tracking |

_Fully customizable through Configure Controls in Foundry_

### **Important Mechanics**

**Template Spells:** Currently auto-target the caster for visual effects rather than placing templates for area targeting. Proper template placement will be added in v2.1.

**Thrown Weapons:** Work both in melee range (up to 2-4m) and at distance (up to 2x weapon range) with contextual validation.

**Parrying Ranged Attacks:** Target yourself when parrying a ranged attack with a weapon or shield. The range validation will understand you're defending at your position.

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

**Custom Weapon Features:** Features are for tracking purposes only and do not implement mechanical effects automatically. Use them to mark weapons with house rule properties or campaign-specific traits.

### **Integration Tips**

**Token Action HUD Integration:** When using Token Action HUD Dragonbane v2.4.1+, Fear Tests, Light Tests, Death Rolls, and Severe Injury Tests are automatically excluded from action counting. No manual configuration required.

**Spell Exclusions:** Add spell names to exclude specific spells from validation while keeping animations. Example: `Protector, Heal Wound, Fireball`

**Manual Exclusions:** Use YZE Action Exclusions setting only for custom content not covered by automatic detection (custom abilities, house rules, etc.)

**Manual AA Control:** If automatic spell enhancement causes issues, use the "Disable AA Support" button in settings, then re-enable when ready.

### **Developer API**

```javascript
// Other modules can use the ignore flag system
await game.user.setFlag(
  "token-action-hud-dragonbane",
  "ignoreNextRollForActionCounting",
  true
);
await yourCustomRollFunction();
// Combat Assistant automatically respects this flag
```

---

## 📋 **System Requirements & Dependencies**

### **Required**

| Requirement           | Version | Notes                                                      |
| --------------------- | ------- | ---------------------------------------------------------- |
| **Foundry VTT**       | v12-v13 | v13.345+ recommended                                       |
| **Dragonbane System** | v2.6.0+ | Required for dynamic range calculation                     |
| **socketlib**         | Latest  | Required for status effects and cross-client communication |

### **Recommended**

| Module                        | Purpose               | Benefit                                                                                                 |
| ----------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| **Dragonbane Status Effects** | Enhanced status icons | Provides thematic status effect icons when automatically applying spell effects                         |
| **Automated Animations**      | Spell animations      | Enables visual animations for all spells; without this module, Universal Spell AA Support has no effect |

### **Optional Integrations**

| Module                                  | Purpose          | Integration Details                                            |
| --------------------------------------- | ---------------- | -------------------------------------------------------------- |
| **Year Zero Engine Combat**             | Action tracking  | Automatic single action tracking with seamless YZE integration |
| **Token Action HUD Dragonbane v2.4.1+** | Quick actions    | Enhanced compatibility with automatic utility roll exclusions  |
| **Argon - Combat HUD (DRAGONBANE)**     | Combat interface | Compatible with Argon's enhanced combat interface              |

### **Installation Notes**

- **socketlib** is mandatory - the module will not function properly without it
- Install **Dragonbane Status Effects** before enabling automatic status effects for optimal visual experience
- **Automated Animations** should be installed and configured if you plan to use Universal Spell AA Support

---

## 🌍 **Localization & Support**

- **Languages**: Full support for English and Swedish using official Dragonbane translation keys
- **Community Contributors**:
  - **dgladkov** - Encumbrance fixes and distance calculations for large/huge tokens
  - **xdy** - Swedish language improvements and localization fixes
- **Support**: [GitHub Issues](https://github.com/kergalli/dragonbane-action-rules/issues)
- **Documentation**: [Full Changelog](https://github.com/kergalli/dragonbane-action-rules/blob/main/CHANGELOG.md)

---

## ⚖️ **License & Disclaimer**

MIT License. This is an unofficial, fan-created module. Not affiliated with Free League Publishing. Dragonbane™ is a trademark of Free League Publishing.
