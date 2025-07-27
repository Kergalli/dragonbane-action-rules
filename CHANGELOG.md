# Changelog

All notable changes to the Dragonbane Combat Assistant module will be documented in this file.

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
