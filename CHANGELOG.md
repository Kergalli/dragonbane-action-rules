# Changelog

## [2.2.0] - 2025-11-16

### **New Feature: Custom Weapon Features**

- **Custom Weapon Features Setting** - Add custom weapon features to the system via comma-separated list in module settings
- **Seamless Integration** - Custom features appear in weapon feature checkboxes alongside core Dragonbane features
- **Tracking Only** - These features are for organizational and tracking purposes only; they do not automate underlying game rules

### **Usage Examples**

**Setting Input:**

```
Articulated, Heavy, Small, Wounding
```

**Result:** All weapons can now be marked with these custom features in their feature checkboxes, allowing GMs and players to track additional weapon properties for house rules, variant systems, or campaign-specific mechanics.

### **Use Cases**

- **House Rules** - Track custom weapon properties for homebrew rules
- **Campaign Features** - Mark weapons with special campaign-specific properties
- **Variant Systems** - Support non-standard weapon features from supplements
- **Organization** - Categorize weapons with additional descriptive features

**Note:** Custom weapon features appear in weapon sheets and are stored in weapon data, but do not automatically apply any mechanical effects. Rule implementation remains manual as intended for maximum flexibility.

---

## [2.1.3] - 2025-11-15

### Grudge Tracker Improvements

- **Simplified Table Management**

  - **Removed Delete Buttons** - Players can now edit grudge tables directly in the journal editor using standard Foundry tools
  - **Native Foundry Table Structure** - Users can add, delete, and modify grudge entries using familiar Foundry table tools
  - **Cleaner Interface** - Eliminated JavaScript dependencies that broke when journals were edited manually
  - **Improved Stability** - No more broken buttons after journal page edits

### Technical Improvements

- **Fixed Duplicate Notifications** - Resolved issue where Grudge Tracker setup button showed success message twice

### Migration Notes

- **Existing Grudge Journals** - Will continue to work normally, but delete buttons and editing features in old entries will not function
- **Recreate the Grudge Journals** - Easiest thing to do is delete the old Unforgiving Tracker folder and grudge journals and recreate them
- **Preserving Old Tables** - If you want to preserve the old grudge table, and enable the edit features, you will need to edit the underlying HTML so it looks like this:

```
<div style="padding-top:15px">
    <table>
        <tbody>
            <tr style="color: white; background-color: rgba(74, 36, 7, 0.8);">
                <td style="color:white">
                    <p>Date</p>
                </td>
                <td style="color:white">
                    <p>Enemy</p>
                </td>
                <td style="color:white;text-align:center">
                    <p>Damage</p>
                </td>
                <td style="color:white">
                    <p>Location</p>
                </td>
            </tr>
            <tr id="grudge-1763185269489-0h0mfqmo8">
                <td>
                    <p>11/14/2025</p>
                </td>
                <td>
                    <p><strong>Orc - Warrior</strong></p>
                </td>
                <td style="text-align:center">
                    <p>6</p>
                </td>
                <td>
                    <p>Battlemap - Field (large)</p>
                </td>
            </tr>
        </tbody>
    </table>
</div>

- Replace the top <div>
- Replace <thead> and </thead> with <tbody> and </tbody>
- Replace <th> and </th> tags with <td> and </td>
- Remove the delete button column line: <th style="color: white; text-align: center; width: 40px;"></th>
```

---

## [2.1.2] - 2025-11-02

### Localization Improvements

- **Fixed hardcoded text in grudge tracker** - Replaced remaining hardcoded English strings in `grudge-tracker.js` with proper localization keys (courtesy of **xdy**)
- **Improved internationalization consistency** - All grudge tracker messages now properly support multiple languages

### 🇸🇪 Swedish Language Enhancements

- **Swedish Language Fixes** - Various improvements and corrections to Swedish translations (courtesy of **xdy**)
- **Enhanced Localization** - Better language support and more accurate translations throughout the module

---

## [2.1.1] - 2025-10-26

### New Features

- **YZE Action Inclusions - Abilities**
  - New setting to specify heroic and kin abilities that should count as actions for YZE Combat integration
  - Automatically detects ability usage from chat messages using UUID parsing
  - Configurable multiline text field with default examples: Battle Cry, Berserker, Companion, Master Carpenter, Musician, Body Slam, Hunting Instincts, Raise Spirits
  - Complements existing YZE Action Exclusions for comprehensive action tracking control

### Localization Improvements

#### 🇸🇪 Swedish Language Enhancements

- **Swedish Language Fixes** - Various improvements and corrections to Swedish translations (courtesy of **xdy**)
- **Enhanced Localization** - Better language support and more accurate translations throughout the module

---

## [2.1.0] - 2025-01-21

### Major Compatibility Update

- **Dragonbane v2.6 Compatibility**
  - Uses core v2.6 distance calculation for dynamic range calculation and consistency with combat system
  - Supports active effects that modify weapon ranges
  - Improved accuracy for large tokens (resolves known issue)
  - Preserves custom Chebyshev distance calculation as fallback to maintain correct diagonal range calculation (4m for 2 squares diagonally vs Foundry's 5.66m)

### Enhanced User Experience

- **Thrown Weapon Attack Dialog Notes**
  - Melee actions are no longer hidden when attacking from a distance (v2.6 core change)
  - Players can now switch from thrown attacks to melee attacks after range validation passes
  - Thrown weapons default to "throw" action when attacking at range, but melee options remain available

### Bug Fixes

- Fixed ranged weapons showing "maximum range of 0m"
- Thrown weapons now work correctly at all distances with large tokens
- Active effects on character attributes now affect weapon ranges dynamically

### Technical Improvements

- Distance calculation now prioritizes core Dragonbane v2.6 method when available
- Maintains backwards compatibility with proven grid-based distance fallback

### System Requirements

- **Breaking Change** - Now requires Dragonbane v2.6.0 or higher
- Previous versions should continue using Combat Assistant v2.0.4

---

## [2.0.4] - 2025-09-23

### New Features

- **AOE Rule Reminder Dialog**
  - Added optional rule reminder dialog for area of effect spells (sphere and cone spells)
  - Shows before spell casting to remind players about dodge vs parry rules and target exemption mechanics
  - Configurable setting to enable/disable the reminder dialog

### Enhancements

- **Large and Huge Token Targeting**

  - Adjusted the way large and huge tokens are targeted and validated when being attacked with melee weapons and spells. Ranged and thrown weapons will still require a core Dragonbane update (coming in v2.6). Thanks to dgladkov for the assist on this one!

---

## [2.0.3] - 2025-09-16

### Bug Fixes

- **Fixed Critical Effects for Damage Spells**
  - **Double Damage Option** - Resolved issue where "Double damage" option was incorrectly removed from ALL spells during critical hit resolution
  - **Logic Correction** - "Double damage" option is now only removed from enhanced non-damage spells
  - **Choose Button Creation** - Fixed bug where "Choose" button was being added to all spells with critical hits
  - **Targeted Behavior** - "Choose" button is now only added for enhanced non-damage spells that need it

---

## [2.0.2] - 2025-09-16

### Bug Fixes

- **Fixed Ranged Spell Self-Targeting for Non-Damage Spells**
  - Ranged utility spells (Animal Whisperer, Gnome, Salamander, Undine, Sylph, etc.) can now properly target the caster
  - **Logic Update** - Only ranged spells WITH damage are blocked from self-targeting (prevents shooting yourself with Fireball)
  - **Utility Spells Allowed** - Ranged spells with blank or "n/a" damage fields can now target the caster (allows beneficial self-buffs)
  - **No Breaking Changes** - All existing spell behavior preserved, only removes incorrect restriction

---

## [2.0.1] - 2025-09-15

### Bug Fixes

- **Fixed Enhanced Spell Critical Effects Display**

  - Resolved issue where "Choose" button was incorrectly hidden for enhanced non-damage spells with dragon rolls
  - Enhanced spells now properly display critical effects selection interface identical to non-enhanced spells

- **Removed Invalid Critical Effects for Non-Damage Spells**

  - "Double damage" option no longer appears in critical effects list for enhanced non-damage spells

- **Fixed Encumbrance Validator for Root Actors**

  - Now properly handles named folder and actors outside named folder. Moved condition check earlier - thanks to dgladov for catching that!

---

## [2.0.0] - 2025-09-13

**Dragonbane Combat Assistant v2.0.0** transforms the module from a combat-focused tool into a **combat AND spellcasting assistant**, extending all functionality to spells.

### **✨ Universal Spell Support for Automated Animations**

- **Animation Enhancement System**

  - Automatically makes all non-damage spells compatible with Automated Animations
  - Intelligent background enhancement that preserves original spell appearance
  - Hidden button system maintains clean UI while enabling AA `data-spell-id` attributes
  - Zero breaking changes to existing damage spells

- **Manual AA Control System**
  - User-controlled "Enable AA Support" and "Disable AA Support" buttons in settings
  - Clean rollback capability for users who need to disable enhancements

### **🎯 Comprehensive Spell Validation System**

- **Smart Target Validation**

  - **Range spells** Require exactly 1 target selection
  - **Touch spells** Require exactly 1 target selection
  - **Personal spells** Automatically target the caster
  - **Template spells** Auto-target caster for AA animations

- **Spell Range Validation**
  - **Touch spells** → Must be adjacent (within 2m)
  - **Range spells** → Must be within spell's listed range
  - **Template/Personal spells** → Skip range validation

### **🎭 Automatic Status Effect Application**

- **Effect Targeting**

  - **Self-targeting spells** Apply effects to the caster
  - **Target spells** Apply effects to the selected target
  - **Template spells** → Skip automatic effects

- **Dragonbane Status Effects Integration**

  - Seamlessly uses DSE module icons and descriptions when available
  - Fallback system with appropriate Foundry icons when DSE not present
  - Effect origin tracking properly identifies the caster for clean effect management

- **Socketlib Integration**
  - Proper cross-client communication for GM and player casting scenarios
  - Permission-aware effect application respects user roles and ownership
  - Prevents race conditions and duplicate effect application

### **⚙️ Enhanced Configuration System**

- **Spell-Specific Settings**
  - **Enable Universal Spell Automated Animations** - Master toggle for AA compatibility
  - **Enable Spell Target Validation** - Smart target selection enforcement
  - **Enable Spell Range Validation** - Distance checking for spell casting
  - **Enable Automatic Status Effects** - Apply appropriate effects on successful casts
  - **Spell Exclusions** - Simple comma-separated list to skip validation while keeping animations

### **🏆 Technical Improvements **

- **Enhanced Stability for Existing Systems**
  - **Encumbrance Monitor improvements** - Benefited from enhanced error handling and streamlined hook management
  - **Grudge Tracker reliability** - Improved cross-version compatibility and more robust journal operations

---

## [1.4.0] - 2025-09-01

### Code Quality & Stability Improvements

- **Internal Architecture Cleanup** - Simplified hook system and better alignment with core Dragonbane patterns
- **Enhanced Error Handling** - Consistent use of DoD_Utility.WARNING throughout module
- **Settings System Improvements** - More robust onChange handlers and better initialization

### **NEW FEATURE: Unforgiving Grudge Tracking System**

- **Automatic grudge detection** - Monitors damage to characters with "Unforgiving" kin ability
- **Interactive grudge journals** - Creates formatted journal tables to track enemies
- **Smart damage correlation** - Links attack rolls with damage application for accurate attacker identification
- **One-click grudge management** - "Add to Grudge List" button appears in chat for qualifying damage
- **Comprehensive grudge records** - Tracks attacker name, damage, location, date, and critical hits
- **Organized journal system** - Automatically creates "Unforgiving Tracker" folders with per-character journals
- **Easy grudge maintenance** - Delete buttons in journals for removing settled scores
- **Critical damage highlighting** - Special indicators (💥) for grudges caused by critical hits
- **Configurable tracking** - Can be enabled/disabled through module settings
- **NOTE** - The GM will need to create the folder and Journal before Dwarf players can record grudges. Simply click the **Setup Grudge Folders for All PCs** button in settings once your Dwarf characters have been assigned to players, after that players will be able to record grudges.

### Simplified Keyboard Controls

- **Streamlined validation toggle** - Replaced multiple keyboard shortcuts with single Alt-V master toggle
- **Cleaner user experience** - Simple on/off toggle for all combat validations (target selection, range checking, monster prevention)
- **Removed complexity** - Eliminated Alt+T (target), Alt+R (range), Alt+A (all), and Alt+X (reset) shortcuts in favor of single toggle

### Styling

- **Aligned with Foundry** - Chat messages now stylistically align with core Dragonbane output

### Bug Fixes

- **Fixed NPC weapon validation** - NPC sheets now properly validate weapon attacks
- **Fixed validation persistence** - Attack validation no longer lost when reopening character sheets
- **Improved sheet compatibility** - Better handling of both PC and NPC sheet DOM structures
- **Fixed grudge tracker delete buttons in Foundry v13** - Delete buttons in grudge journals now work correctly in both Foundry v12 and v13
- **Improved cross-version compatibility** - Enhanced journal sheet handling for better stability across Foundry versions

### Technical Improvements

- **Enhanced compatibility** - Better integration with core Dragonbane system patterns
- **Performance optimizations** - Streamlined code execution and reduced redundancy
- **Internal code optimization** - Streamlined actor finding, validation, and YZE integration logic for improved maintainability
- **Reduced code complexity** - Simplified over-engineered patterns while maintaining full functionality
- **Enhanced error handling** - More consistent error handling patterns throughout the module

---

## [1.3.9] - 2025-08-28

### Enhanced Compatibility

- **Updated encumbrance status effect default name** from "Encumbered" to "Over-Encumbered" to align with core Dragonbane terms and Dragonbane Status Effects module
- **Improved localization** for encumbrance status effect names
- **Better integration** with Dragonbane Status Effects module - automatically uses existing "Over-Encumbered" effect if available
- **Maintained backward compatibility** - existing custom status effect names remain unchanged

### Documentation Updates

- **Added Token Action HUD integration tips** for YZE Action Exclusions to improve action tracking accuracy

---

## [1.3.8] - 2025-08-20

### Bug Fixes (Attempt 2)

- **Fixed The Forge Module Bazaar compatibility**
  - Eliminated circular import in debug logging system
  - Added window object timing safeguards for monster prevention
  - Fixed Swedish localization issues (many thanks to xdy!)
- **Enhanced error handling** for better debugging
- **We Are 138, We Are 138** - We Are 138!

---

## [1.3.7] - 2025-08-20

### Bug Fixes (Attempted)

- **Fixed The Forge Module Bazaar compatibility**
  - Changed relative imports to absolute paths to resolve Forge's ES6 module loading issues
  - Monster action prevention system now works correctly when installed via Forge Bazaar
  - No functional changes for other installation methods

---

All notable changes to the Dragonbane Combat Assistant module will be documented here.

## [1.3.6] - 2025-08-20

### Bug Fixes

- Fixed installation issues with The Forge Module Bazaar where scripts failed to load
- No functional changes - version bump to resolve Forge infrastructure issue

---

## [1.3.5] - 2025-08-19

### Major New Features

- **Monster Action Prevention System**

  - **Pre-roll confirmation dialogs** for Parry and Disarm attempts against monsters
  - **Educational approach** - informs players about rules before they attempt invalid actions
  - **Prevents invalid advancement** - blocks the roll entirely when user cancels, avoiding skill advancement on impossible actions
  - **Smart bypass for edge cases** - allows exceptions when user clicks "Proceed" for rare situations where rules permit

- **Enhanced YZE Integration**
  - **Contextual notifications** - different messages for Player Characters vs NPCs/Monsters
  - **Improved user experience** - clearer messaging that acknowledges push roll uncertainty for PCs

### Technical Details

- **Prevention Logic** - Uses `preCreateChatMessage` hook to intercept actions before they create chat messages
- **Pattern Integration** - Leverages existing pattern manager for reliable action detection across languages

---

## [1.3.3] and [1.3.4] - 2025-08-17

### Bug Fixes

- **Fixed Non-Combat Token YZE Messages**

  - Resolved issue where tokens not in combat were incorrectly showing "An action has already been performed by..." messages
  - YZE integration now properly distinguishes between combatants and non-combatants
  - Non-combat tokens are silently ignored by action tracking system

- **Fixed Damage Roll Double Action Detection**
  - Resolved issue where damage rolls (from "Roll Damage" buttons) were incorrectly detected as separate actions
  - Damage and healing rolls are now properly excluded from YZE action tracking
  - Prevents double action status effects when following attack → damage workflow
  - Uses reliable CSS class and data attribute detection for all damage/healing roll types

### Technical Improvements

- **Enhanced YZE Integration Logic**
  - Added `isActorInCurrentCombat()` method for proper combatant verification
  - Added `_isDamageRoll()` method for reliable damage/healing roll detection
  - Improved action detection priority to check damage rolls before pattern matching
  - Better separation of concerns between combat and non-combat scenarios

---

## [1.3.2] - 2025-08-17

### New Features

- **YZE Action Tracking Override (Alt+Y)**

  - New keyboard shortcut to temporarily disable Year Zero Engine action status effect application
  - Useful for handling edge cases where rolls are incorrectly detected as actions
  - Allows manual action management when automatic tracking isn't desired
  - Follows the same pattern as existing validation overrides

- **Override Status Display (Alt+S)**
  - New keyboard shortcut to show personal override status via notification
  - Displays currently active overrides or "All validation rules active" if none
  - Personal notifications that don't clutter chat or affect other players
  - Localized support for English and Swedish

### Bug Fixes

- **Fixed "Mark Weapon Broken" Button**
  - Resolved "Cannot read properties of null (reading 'markWeaponBroken')" error
  - Button now works correctly again after module initialization timing issues
  - Improved error handling and logging for weapon marking functionality

### Enhanced Override System

- **Updated "All Overrides" (Alt+A)**
  - Now includes YZE action tracking in addition to validation rules
  - Updated localization to reflect expanded scope
  - Reset function (Alt+X) now clears all override types including YZE

### Updated Keyboard Shortcuts

| Shortcut    | Function               | Description                                               |
| ----------- | ---------------------- | --------------------------------------------------------- |
| **Alt + T** | Toggle Target Override | Temporarily disable/enable target selection enforcement   |
| **Alt + R** | Toggle Range Override  | Temporarily disable/enable weapon range validation        |
| **Alt + Y** | Toggle YZE Override    | Temporarily disable/enable YZE action tracking            |
| **Alt + S** | Show Override Status   | Display current override status via personal notification |
| **Alt + A** | Override All           | Temporarily disable/enable all validation and tracking    |
| **Alt + X** | Reset All              | Clear all temporary overrides                             |

---

## [1.3.1] - 2025-08-13

### Major New Features

- **Keyboard Shortcuts for Validation Overrides**
  - Quick bypass controls for temporarily disabling validation rules during gameplay
  - **Alt + T** - Toggle target selection enforcement on/off
  - **Alt + R** - Toggle weapon range checking on/off
  - **Alt + A** - Override all validation rules at once
  - **Alt + X** - Reset all overrides to default state
  - Per-user control - each player manages their own override state independently
  - Session-only overrides - automatically clear when Foundry reloads
  - Fully customizable keybinds through Foundry's Configure Controls menu
  - Localized notifications provide clear feedback when overrides are toggled

---

## [1.3.0] - 2025-08-12

### Major New Features

- **Year Zero Engine Combat Integration**
  - Seamless integration with YZE Combat module for single action tracking
  - Automatic action detection from chat messages (weapon attacks, spells, skills, monster attacks)
  - Smart exclusion of reaction spells from action tracking
  - Configurable custom exclusions for specific dice roll patterns
  - Multi-action support for characters with multiple action slots per round
  - User-friendly notifications when all actions have been used

### Major Code Refactoring & Optimization

- **Consolidated Pattern Management**

  - All localization and pattern matching logic centralized to `pattern-manager.js`
  - Language-agnostic pattern compilation using Dragonbane's core localization keys
  - Improved pattern accuracy and performance optimization

- **Streamlined Architecture**

  - Consolidated message processing across all components
  - Simplified hook management system for better reliability
  - Merged duplicate methods from `rules-display.js` into centralized `utils.js`
  - Enhanced code organization and maintainability

- **Performance Improvements**
  - Greatly simplified token distance calculation algorithm
  - Optimized pattern matching and chat message analysis
  - Removed unnecessary fallback methods and cleaned up abandoned code
  - Reduced memory footprint and improved execution speed

### Enhanced Localization Support

- **Complete Language Coverage**
  - Additional localization strings for comprehensive coverage
  - Fixed "weakspot/weakpoint" terminology confusion between display and localization keys
  - Cleaned up unused language keys for leaner translation files
  - Improved language-agnostic operation across all features

### Technical Improvements

- **Foundry v14 Compatibility Preparation**

  - Updated several (but not all) items that will be deprecated in Foundry v14
  - Improved compatibility with current and future Foundry versions
  - Enhanced status effect handling with v12+ compatible properties

- **Code Quality & Maintenance**
  - Removed abandoned development code and unused console commands
  - Consolidated redundant utility methods
  - Improved error handling and fallback mechanisms
  - Enhanced debug logging and troubleshooting capabilities

### Bug Fixes

- Fixed pattern detection accuracy for special attack types
- Improved reliability of thrown weapon contextual validation
- Enhanced actor and message processing error handling
- Resolved edge cases in encumbrance monitoring

### Known Issues

- **Thrown Weapons vs Large Tokens** - In the core Dragonbane module, thrown weapons measure distance to a single reference grid square (upper left) instead of using token bounds. This causes attacks with thrown weapons against large and huge tokens to default to the Throw dialog when attacking from anywhere not adjacent to the upper left grid square of the enemy. This is a limitation of the core system's distance calculation and is outside the scope of this module to fix.

---

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
- Now correctly targeting NPCs in scene when marking weapons broken

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

- **Compatibility** - Foundry VTT v12 and v13
- **System** - Dragonbane only
- **Performance** - Minimal resource usage with efficient regex patterns
- **Localization** - Complete i18n support for future translations

---
