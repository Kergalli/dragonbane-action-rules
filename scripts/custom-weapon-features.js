/**
 * Custom Weapon Features Manager
 * Handles adding user-defined weapon features to the core Dragonbane system
 */

import { SETTINGS } from "./settings.js";
import { DragonbaneUtils } from "./utils.js";

export class CustomWeaponFeaturesManager {
  constructor(moduleId) {
    this.moduleId = moduleId;
  }

  /**
   * Initialize custom weapon features
   */
  initialize() {
    try {
      this.refreshCustomWeaponFeatures();
      DragonbaneUtils.debugLog(
        this.moduleId,
        "CustomWeaponFeatures",
        "Custom weapon features manager initialized",
      );
    } catch (error) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "CustomWeaponFeatures",
        `Initialization error: ${error.message}`,
      );
    }
  }

  /**
   * Refresh custom weapon features from settings
   */
  refreshCustomWeaponFeatures() {
    try {
      // Check if core system is available
      if (!CONFIG.DoD?.weaponFeatureTypes) {
        DragonbaneUtils.debugLog(
          this.moduleId,
          "CustomWeaponFeatures",
          "CONFIG.DoD.weaponFeatureTypes not available yet",
        );
        return;
      }

      // Get custom features from settings
      const customFeatures = DragonbaneUtils.getSetting(
        this.moduleId,
        SETTINGS.CUSTOM_WEAPON_FEATURES,
        "",
      );

      if (!customFeatures.trim()) {
        DragonbaneUtils.debugLog(
          this.moduleId,
          "CustomWeaponFeatures",
          "No custom weapon features defined",
        );
        return;
      }

      // Parse and add features.
      // Each entry may carry an optional tooltip after a "|" separator:
      //   "Wounding|Inflicts an extra wound on a critical hit"
      // Entries without "|" simply have no tooltip.
      const featureList = customFeatures
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

      let addedCount = 0;

      featureList.forEach((entry) => {
        // Split name from optional tooltip on the first "|" only.
        const pipeIndex = entry.indexOf("|");
        const name =
          pipeIndex === -1 ? entry.trim() : entry.slice(0, pipeIndex).trim();
        const tooltip =
          pipeIndex === -1 ? "" : entry.slice(pipeIndex + 1).trim();

        if (!name) return;

        // Create a key from the feature name (lowercase, no spaces).
        const key = name.toLowerCase().replace(/\s+/g, "");

        // Add to CONFIG.DoD.weaponFeatureTypes if not already present.
        if (!CONFIG.DoD.weaponFeatureTypes[key]) {
          // Use a namespaced i18n key as the config value so the core
          // system's "value + 'Tooltip'" concatenation resolves to a clean,
          // collision-safe localization key.
          const nameKey = `DRAGONBANE_ACTION_RULES.customFeature.${key}`;
          const tooltipKey = `${nameKey}Tooltip`;

          CONFIG.DoD.weaponFeatureTypes[key] = nameKey;

          // Inject translations live. game.i18n is fully loaded by the time
          // this runs (ready hook / settings onChange), and the core weapon
          // sheet resolves these keys lazily on each render.
          game.i18n.translations[nameKey] = name;
          // Always register the tooltip key (empty string when none given) so
          // hovering never shows the raw key text.
          game.i18n.translations[tooltipKey] = tooltip;

          addedCount++;

          DragonbaneUtils.debugLog(
            this.moduleId,
            "CustomWeaponFeatures",
            `Added custom weapon feature: ${name} (key: ${key})${
              tooltip ? ` with tooltip` : ``
            }`,
          );
        }
      });

      if (addedCount > 0) {
        // Notify GM about added features
        if (game.user.isGM) {
          ui.notifications.info(
            `Combat Assistant: Added ${addedCount} custom weapon feature${
              addedCount > 1 ? "s" : ""
            }`,
          );
        }

        DragonbaneUtils.debugLog(
          this.moduleId,
          "CustomWeaponFeatures",
          `Successfully added ${addedCount} custom weapon features`,
        );
      }
    } catch (error) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "CustomWeaponFeatures",
        `Error refreshing custom weapon features: ${error.message}`,
      );

      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Custom weapon features error: ${error.message}`);
      }
    }
  }

  /**
   * Get list of currently active custom features
   */
  getActiveFeatures() {
    const customFeatures = DragonbaneUtils.getSetting(
      this.moduleId,
      SETTINGS.CUSTOM_WEAPON_FEATURES,
      "",
    );

    if (!customFeatures.trim()) return [];

    return customFeatures
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => {
        const pipeIndex = entry.indexOf("|");
        return pipeIndex === -1 ? entry : entry.slice(0, pipeIndex).trim();
      });
  }
}
