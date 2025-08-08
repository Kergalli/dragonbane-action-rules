# Changelog

All notable changes to the Dragonbane Combat Assistant module will be documented here.

## [1.2.4] - 2025-08-06

### Major New Features
- **Thrown Weapon Support**
  - Contextual range validation for weapons with "Thrown" feature
  - Thrown weapons work in melee (≤2m normal, ≤4m long) AND at range (up to 2x weapon range)

### Technical Improvements
- **Pattern-Based Attack Detection System**
  - Complete rewrite of shove detection using chat message content analysis
  - Uses Dragonbane's own localization keys for language-agnostic operation

- **Enhanced Language Support**
  - Fully language-agnostic shove detection
  - Dynamic pattern building from Dragonbane system translation keys
  - All weapon feature detection now uses core Dragonbane system keys (`DoD.weaponFeatureTypes.*`)

- **Shove Rules Detection**
  - **Allowed for Shove:** Normal attacks, Stab, Slash, Find Weak Spot (damage-dealing melee)
  - **Excluded from Shove:** Topple, Disarm (no damage), Parry (defensive), Ranged attacks, Spells

### Code Optimization & Performance
- **Streamlined Codebase**
  - Simplified CSS (removed dark mode support)

### Bug Fixes
- Thrown weapons no longer incorrectly blocked at valid throwing distances
- Shove reminders now appear for thrown weapons used in melee combat
- Range validation messages properly distinguish weapon types
- Pattern-based detection eliminates false positives from spells and non-damage attacks

---

## [1.2.3] - 2025-08-05

### Major New Features
- **Optional Shove Rule Integration**
  - Automatic reminders for the optional shove rule when STR damage bonus ≥ opponent's
  - Smart conditional display - only appears for damage-dealing attacks
  - Excludes monsters (cannot shove or be shoved per rules)

- **Dodge Movement Reminders**
  - Automatic movement reminders for successful EVADE rolls

- **Enhanced Optional Rule System**
  - Optional parry movement reminders with dedicated setting
  - Granular control over each optional rule type
  - Clear "OPTIONAL RULE:" prefixes in settings for better organization

### Localization
- **Swedish Translation**
  - Complete localization for all new shove and movement features

---

## [1.2.2] - 2025-07-30
- **Encumbrance Monitoring System**

- Smart status effect creation - automatically creates custom status effects with anchor icon if they don't exist

## [1.2.1] - 2025-07-29
- **Special Attack Detection and Language Localization**

- Fixed detection methods for chat messages when detecting special attack action in different languages

## [1.2.0] - 2025-07-29

### Major New Features
- **Encumbrance Monitoring System**
  - Automatic status effect application when characters become over-encumbered
  - Configurable actor folder monitoring (default: "Party" folder)
  - Instant response to inventory changes, item additions/removals, and strength modifications
  - Optional chat notifications with STR roll rule reminders for over-encumbered movement

- **Full Internationalization Support**
  - Dynamic pattern generation based on current Dragonbane system language
  - Automatic detection of combat actions in any supported language (English, Swedish)
  - Localized success/failure detection using official Dragonbane translation keys
  - English fallback for unsupported languages or missing translations

---

## [1.1.0] - 2025-07-28

### Major New Features
- **Interactive Weapon Management**
  - Added "Mark Weapon Broken" button to parry rules display
  - One-click weapon breaking with confirmation dialog
  - Updates character sheet directly from chat interface
  - Permission-safe: only weapon owners and GMs can mark weapons broken
  - Prevents accidental weapon damage with confirmation dialog

- **Enhanced Weapon Feature Display**
  - Topple attacks now show weapon feature bonuses automatically
  - Displays "Staff Topple Feature: +1 Boon" for weapons with toppling ability
  - Automatically detects weapons with "Toppling" feature

---

## [1.0.0] - 2025-07-26

### Initial Release
Tactical enhancement module for Dragonbane combat.

### Features
- **Attack Validation System**
  - Target selection enforcement for all melee and ranged attacks
  - Weapon range validation (melee: adjacent, long melee: adjacent + 1 grid square, ranged: up to 2x base range)
  - Smart distance calculation handling multi-grid tokens and diagonal movement
  
- **Automatic Combat Rule Display**
  - Detects successful special attacks: Parry, Topple, Disarm, Find Weak Spot
  - Shows relevant rules automatically with configurable delay
  - Weapon durability display when parrying
  - Smart success detection - only shows rules on successful attacks
  
- **Multi-Platform Integration**
  - Works with Token Action HUD and Argon - Combat HUD (DRAGONBANE)
  - Character sheet compatibility

- **Configuration Options**
  - Enable/disable attack validation independently
  - Configurable display timing
  - Optional weapon durability display
  - Debug mode for troubleshooting

### Technical
- **Compatibility**: Foundry VTT v12 and v13
- **System**: Dragonbane only
- **Performance**: Minimal resource usage with efficient regex patterns
- **Localization**: Complete i18n support for future translations

---
