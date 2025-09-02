/**
 * Dragonbane Combat Assistant - Pattern Management (Simplified)
 * Centralized pattern compilation and matching - cleaned up over-engineering
 */

import { DragonbaneUtils } from "./utils.js";

export class DragonbanePatternManager {
  constructor(moduleId) {
    this.moduleId = moduleId;

    // Compiled patterns - simplified to only what's actually needed
    this.compiledPatterns = {
      // Rules display patterns (essential - keep all)
      actions: null,
      success: null,
      failure: null,
      allowedShove: null,
      excludedShove: null,
      // YZE integration patterns (simplified - only what matters)
      dice: null,
      exclusions: null,
    };

    // Raw terms cache
    this._rawTerms = {};

    // Initialize patterns when ready
    Hooks.once("ready", () => this.initializePatterns());
  }

  /**
   * Initialize all patterns for both rules display and YZE integration
   */
  initializePatterns() {
    this._buildLocalizedPatterns();
    this._compilePatterns();
    DragonbaneUtils.debugLog(
      this.moduleId,
      "PatternManager",
      `All patterns initialized for language: ${game.i18n.lang}`
    );
  }

  /**
   * Build localized patterns using simple game.i18n.localize() calls
   */
  _buildLocalizedPatterns() {
    // Simple localized terms with basic fallbacks
    const terms = {
      // Rules display terms (essential)
      parry: game.i18n.localize("DoD.attackTypes.parry") || "parry",
      topple: game.i18n.localize("DoD.attackTypes.topple") || "topple",
      disarm: game.i18n.localize("DoD.attackTypes.disarm") || "disarm",
      weakpoint: game.i18n.localize("DoD.attackTypes.weakpoint") || "weakpoint",
      normal: game.i18n.localize("DoD.attackTypes.normal") || "attack",
      stab: game.i18n.localize("DoD.attackTypes.stab") || "stab",
      slash: game.i18n.localize("DoD.attackTypes.slash") || "slash",
      ranged: game.i18n.localize("DoD.attackTypes.ranged") || "ranged",
      thrown: game.i18n.localize("DoD.attackTypes.throw") || "throw",
      success: game.i18n.localize("DoD.roll.success") || "succeeded",
      failure: game.i18n.localize("DoD.roll.failure") || "failed",
      dragon: game.i18n.localize("DoD.roll.dragon") || "dragon",
    };

    // Clean up terms (remove punctuation, get first word for dragon)
    const cleanSuccess = terms.success.replace(/[.!]$/, "");
    const cleanFailure = terms.failure.replace(/[.!]$/, "");
    const dragonWord = terms.dragon.split(" ")[0] || "dragon";

    // Build pattern arrays - simplified to only essential patterns
    this._rawTerms = {
      // ESSENTIAL - Rules Display patterns (keep all)
      actions: [terms.parry, terms.topple, terms.disarm, terms.weakpoint],
      success: [cleanSuccess, dragonWord],
      failure: [cleanFailure],
      allowedShove: [terms.normal, terms.stab, terms.slash, terms.weakpoint],
      excludedShove: [
        terms.topple,
        terms.disarm,
        terms.parry,
        terms.ranged,
        terms.thrown,
      ],

      // SIMPLIFIED - YZE Integration patterns (only what matters)
      dice: [
        "d6",
        "d8",
        "d10",
        "d12",
        "d20",
        cleanSuccess,
        cleanFailure,
        dragonWord,
        "roll",
      ],
      exclusions: this._buildExclusionTerms(),
    };
  }

  /**
   * Build exclusion terms from module settings
   */
  _buildExclusionTerms() {
    const customExclusions = DragonbaneUtils.getSetting(
      this.moduleId,
      "yzeCustomExclusions",
      ""
    );
    if (!customExclusions.trim()) return [];

    return customExclusions
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0);
  }

  /**
   * Compile all raw terms into optimized regex patterns
   */
  _compilePatterns() {
    if (!this._rawTerms) return;

    // Compile each pattern type
    Object.keys(this.compiledPatterns).forEach((patternType) => {
      const terms = this._rawTerms[patternType];
      this.compiledPatterns[patternType] = this._compileTermsToRegex(terms);
    });
  }

  /**
   * Compile array of terms into single optimized regex
   */
  _compileTermsToRegex(terms) {
    if (!terms || terms.length === 0) return null;

    const escapedTerms = terms.map((term) => this._escapeRegex(term));
    // Add optional punctuation at the end of each term to handle "lyckades." vs "lyckades"
    const pattern = `\\b(?:${escapedTerms.join("|")})(?:[.!])?\\b`;
    return new RegExp(pattern, "i");
  }

  /**
   * Escape special regex characters
   */
  _escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // === RULES DISPLAY INTERFACE (Essential - Keep All) ===

  /**
   * Get action match from content
   */
  getActionMatch(content) {
    const pattern = this.compiledPatterns.actions;
    if (!pattern) return null;

    const match = content.match(pattern);
    return match ? [match[0], match[1] || match[0]] : null;
  }

  /**
   * Check if content indicates successful action
   */
  isSuccessfulAction(content) {
    const successPattern = this.compiledPatterns.success;
    const failurePattern = this.compiledPatterns.failure;

    if (!successPattern || !failurePattern) return false;

    const hasSuccess = successPattern.test(content);
    const hasFailure = failurePattern.test(content);

    return hasSuccess && !hasFailure;
  }

  /**
   * Check if attack type allows shove
   */
  isAttackTypeAllowedForShove(content) {
    const allowedPattern = this.compiledPatterns.allowedShove;
    const excludedPattern = this.compiledPatterns.excludedShove;

    if (!allowedPattern || !excludedPattern) return false;

    // First check if any excluded attack types are present
    if (excludedPattern.test(content)) {
      return false;
    }

    // Then check if any allowed attack types are present
    return allowedPattern.test(content);
  }

  // === YZE INTEGRATION INTERFACE ===

  /**
   * Check if content matches a specific pattern type
   */
  hasPattern(content, patternType) {
    const pattern = this.compiledPatterns[patternType];
    return pattern ? pattern.test(content) : false;
  }

  /**
   * Check if roll should be excluded from YZE tracking
   */
  isExcludedRoll(content) {
    return this.hasPattern(content, "exclusions");
  }

  /**
   * Check if content indicates any action roll
   */
  isAction(content) {
    // Skip excluded rolls first
    if (this.isExcludedRoll(content)) return false;

    // Any dice roll is likely an action worth tracking
    return this.hasPattern(content, "dice");
  }

  // === PATTERN REFRESH ===

  /**
   * Refresh patterns when settings change
   */
  refreshPatterns() {
    this.initializePatterns();
  }

  /**
   * Check if patterns are initialized
   */
  areInitialized() {
    return this.compiledPatterns.actions !== null;
  }
}
