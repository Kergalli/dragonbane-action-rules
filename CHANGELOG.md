# Changelog

All notable changes to the Dragonbane Combat Assistant module will be documented in this file.

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

### Technical Improvements
- **Modular Architecture**
  - Split single large file into 5 focused modules for better maintainability
  - `main.js` - Core module initialization and coordination
  - `settings.js` - All settings registration and management
  - `validation.js` - Attack validation logic (target selection & range checking)
  - `rules-display.js` - Chat message processing and rule display
  - `hooks.js` - Consolidated Foundry VTT hook management
  
- **Consolidated Hook Management**
  - Centralized all hook registration and cleanup
  - Improved method restoration on module disable
  - Better error handling and debugging capabilities
  - Eliminated code duplication in hook lifecycle management

### Localization
- **Complete Swedish Translation** for all new features
  - "Markera Vapen Trasigt" button text
  - "Fäll-funktion: (+1 FÖRDEL)" for topple bonuses
  - All dialog text and error messages translated
  - Consistent localization patterns throughout module

### Bug Fixes
- Improved weapon feature detection accuracy
- Enhanced error handling in all interactive components

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
  - Works with Token Action HUD
  - Character sheet compatibility

- **Configuration Options**
  - Enable/disable attack validation independently
  - Configurable display timing
  - Optional weapon durability display
  - Debug mode for troubleshooting

- **User Experience**
  - Seamless Dragonbane system styling integration
  - Localization support (English and Swedish included)

### Technical
- **Compatibility**: Foundry VTT v12 and v13
- **System**: Dragonbane only
- **Performance**: Minimal resource usage with efficient regex patterns
- **Localization**: Complete i18n support for future translations

---
