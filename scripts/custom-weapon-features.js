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
        "Custom weapon features manager initialized"
      );
    } catch (error) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "CustomWeaponFeatures",
        `Initialization error: ${error.message}`
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
          "CONFIG.DoD.weaponFeatureTypes not available yet"
        );
        return;
      }

      // Get custom features from settings
      const customFeatures = DragonbaneUtils.getSetting(
        this.moduleId,
        SETTINGS.CUSTOM_WEAPON_FEATURES,
        ""
      );

      if (!customFeatures.trim()) {
        DragonbaneUtils.debugLog(
          this.moduleId,
          "CustomWeaponFeatures",
          "No custom weapon features defined"
        );
        return;
      }

      // Parse and add features
      const featureList = customFeatures
        .split(",")
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0);

      let addedCount = 0;

      featureList.forEach((feature) => {
        // Create a key from the feature name (lowercase, no spaces)
        const key = feature.toLowerCase().replace(/\s+/g, "");

        // Add to CONFIG.DoD.weaponFeatureTypes if not already present
        if (!CONFIG.DoD.weaponFeatureTypes[key]) {
          CONFIG.DoD.weaponFeatureTypes[key] = feature;
          addedCount++;

          DragonbaneUtils.debugLog(
            this.moduleId,
            "CustomWeaponFeatures",
            `Added custom weapon feature: ${feature} (key: ${key})`
          );
        }
      });

      if (addedCount > 0) {
        // Notify GM about added features
        if (game.user.isGM) {
          ui.notifications.info(
            `Combat Assistant: Added ${addedCount} custom weapon feature${
              addedCount > 1 ? "s" : ""
            }`
          );
        }

        DragonbaneUtils.debugLog(
          this.moduleId,
          "CustomWeaponFeatures",
          `Successfully added ${addedCount} custom weapon features`
        );
      }
    } catch (error) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "CustomWeaponFeatures",
        `Error refreshing custom weapon features: ${error.message}`
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
      ""
    );

    if (!customFeatures.trim()) return [];

    return customFeatures
      .split(",")
      .map((feature) => feature.trim())
      .filter((feature) => feature.length > 0);
  }
}
