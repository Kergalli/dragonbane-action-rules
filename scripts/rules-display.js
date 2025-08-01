/**
 * Dragonbane Combat Assistant - Rules Display
 * Handles chat message processing and automatic rule display
 */

export class DragonbaneRulesDisplay {
    constructor(moduleId) {
        this.moduleId = moduleId;
        this.flagsKey = 'dragonbaneRulesMessage';
        
        // Dynamic patterns - will be set during initialization
        this.actionPattern = null;
        this.successPattern = null;
        this.failurePattern = null;
        
        // Initialize patterns when ready
        Hooks.once('ready', () => this.initializeLocalizedPatterns());
    }

    /**
     * Initialize localized patterns based on current language
     */
    initializeLocalizedPatterns() {
        try {
            // Get localized action terms from Dragonbane system
            const parry = this.getLocalizedTerm("DoD.attackTypes.parry", "parry");
            const topple = this.getLocalizedTerm("DoD.attackTypes.topple", "topple");
            const disarm = this.getLocalizedTerm("DoD.attackTypes.disarm", "disarm");
            const weakpoint = this.getLocalizedTerm("DoD.attackTypes.weakpoint", "weakpoint");
            
            // Build action pattern (including English fallback for "weak spot")
            const actions = [parry, topple, disarm, weakpoint, "weak\\s+spot"]
                .map(term => this.escapeRegex(term))
                .join('|');
            
            this.actionPattern = new RegExp(`(${actions})`, 'i');
            
            // Get success/failure terms
            const success = this.getLocalizedTerm("DoD.roll.success", "succeeded").replace(/[.!]$/, '');
            const failure = this.getLocalizedTerm("DoD.roll.failure", "failed").replace(/[.!]$/, '');
            const dragon = this.getLocalizedTerm("DoD.roll.dragon", "succedeed with a Dragon!");
            
            // Extract success word from dragon message (e.g., "lyckades" from "lyckades med ett Drakslag!")
            const dragonWord = dragon.split(' ')[0] || 'dragon';
            
            // Build success/failure patterns
            this.successPattern = new RegExp(`(${this.escapeRegex(success)}|${this.escapeRegex(dragonWord)})`, 'i');
            this.failurePattern = new RegExp(`(${this.escapeRegex(failure)})`, 'i');
            
            this.debugLog(`Localized patterns initialized for language: ${game.i18n.lang}`);
            
        } catch (error) {
            console.warn(`${this.moduleId} | Error building localized patterns, falling back to English:`, error);
            this.initializeFallbackPatterns();
        }
    }

    /**
     * Get localized term with English fallback
     */
    getLocalizedTerm(key, fallback) {
        try {
            const localized = game.i18n.localize(key);
            // If localization failed, it returns the key itself
            return localized === key ? fallback : localized;
        } catch (error) {
            return fallback;
        }
    }

    /**
     * Escape special regex characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Initialize fallback English patterns
     */
    initializeFallbackPatterns() {
        this.actionPattern = /(parry|topple|disarm|weakpoint|weak\s+spot)/i;
        this.successPattern = /(succeeded|succeded|dragon)/i;
        this.failurePattern = /failed/i;
        this.debugLog("Using fallback English patterns");
    }

    /**
     * Handle chat message for rule display - main entry point
     */
    onChatMessage(message) {
        try {
            // Skip if patterns aren't initialized yet
            if (!this.actionPattern) return;
            
            // Skip if already a rules message
            if (message.getFlag(this.moduleId, this.flagsKey)) return;

            const content = message.content;
            if (!content) return;

            // Check for action pattern
            const actionMatch = content.match(this.actionPattern);
            if (!actionMatch) return;

            // Only show rules for successful attacks
            if (!this.isSuccessfulAction(content)) return;

            // Prevent duplicate rules when multiple users are online
            if (!this.shouldCreateRules(message)) return;

            this.processAction(message, actionMatch);

        } catch (error) {
            console.error(`${this.moduleId} | Error processing chat message:`, error);
        }
    }

    /**
     * Check if action was successful
     */
    isSuccessfulAction(content) {
        if (!this.successPattern || !this.failurePattern) return false;
        
        const successMatch = content.match(this.successPattern);
        const failureMatch = content.match(this.failurePattern);
        return successMatch && !failureMatch;
    }

    /**
     * Determine if this client should create the rules message to prevent duplicates
     */
    shouldCreateRules(message) {
        // If there's a GM online, only let the GM create rules
        const activeGM = game.users.find(user => user.active && user.isGM);
        if (activeGM) {
            return game.user.isGM;
        }

        // If no GM is online, let the message author create rules
        const messageAuthor = game.users.get(message.user);
        if (messageAuthor && messageAuthor.active) {
            return game.user.id === message.user;
        }

        // Fallback: let the first active user (by ID) create rules
        const firstActiveUser = game.users.find(user => user.active);
        return firstActiveUser && game.user.id === firstActiveUser.id;
    }

    /**
     * Process detected action and display rules
     */
    async processAction(message, actionMatch) {
        const action = actionMatch[1].toLowerCase();
        const normalizedAction = action.includes('weak') || action.includes('glipa') ? 'weakspot' : 
                                action.includes('parera') ? 'parry' :
                                action.includes('fäll') ? 'topple' :
                                action.includes('avväpna') ? 'disarm' : action;
        let ruleContent;
        let weapon = null;

        if (normalizedAction === 'parry') {
            weapon = this.extractWeaponFromMessage(message);
            const dragonRolled = this.detectDragonRoll(message);
            const actor = message.speaker?.actor ? game.actors.get(message.speaker.actor) : null;
            const parryResult = this.getParryRules(weapon, dragonRolled, actor);
            ruleContent = parryResult.content;
            weapon = parryResult.weapon;
        } else if (normalizedAction === 'topple') {
            weapon = this.extractWeaponFromMessage(message);
            ruleContent = this.getToppleRules(weapon);
        } else {
            ruleContent = this.getActionRules(normalizedAction);
        }

        if (ruleContent) {
            await this.displayRules(normalizedAction, ruleContent, weapon, message.speaker?.actor);
        }
    }

    /**
     * Extract weapon information from chat message
     */
    extractWeaponFromMessage(message) {
        try {
            // UUID pattern remains static as it's not localized
            const UUID_PATTERN = /@UUID\[Actor\.[^\.]+\.Item\.([^\]]+)\]/;
            
            // Try to extract from UUID pattern first
            const uuidMatch = message.content.match(UUID_PATTERN);
            if (uuidMatch && message.speaker?.actor) {
                const actor = game.actors.get(message.speaker.actor);
                const weapon = actor?.items.get(uuidMatch[1]);
                if (weapon && weapon.type === 'weapon') return weapon;
            }

            // Fallback: find equipped weapons
            if (message.speaker?.actor) {
                const actor = game.actors.get(message.speaker.actor);
                const equippedWeapons = actor?.items.filter(i => 
                    i.type === "weapon" && (i.system?.worn === true || i.system?.mainHand === true)
                );
                if (equippedWeapons?.length === 1) return equippedWeapons[0];
            }

            return null;
        } catch (error) {
            console.error(`${this.moduleId} | Error extracting weapon:`, error);
            return null;
        }
    }

    /**
     * Get parry rules with weapon durability (hidden for monsters)
     */
    getParryRules(weapon, dragonRolled = false, actor = null) {
        const showDurability = this.getSetting('showParryDurability', true);
        const isMonster = this.isMonsterActor(actor);
        let content = "";
        
        // Only show weapon durability for non-monsters
        if (showDurability && !isMonster) {
            if (weapon) {
                const durability = weapon.system?.durability || 0;
                const weaponName = weapon.name || game.i18n.localize("DRAGONBANE_ACTION_RULES.unknownWeapon");
                content += `<li><strong>${weaponName} ${game.i18n.localize("DRAGONBANE_ACTION_RULES.durability")}:</strong> ${durability}</li>`;
            } else {
                content += `<li class="weapon-warning">${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.noWeaponFound")}</li>`;
            }
        }
        
        content += this.getParryRulesList(dragonRolled);
        return { content, weapon: isMonster ? null : weapon }; // Don't return weapon for monsters (prevents broken button)
    }

    /**
     * Check if the actor is a monster type
     */
    isMonsterActor(actor) {
        if (!actor) return false;
        
        this.debugLog(`Checking actor type: ${actor.name} (type: ${actor.type})`);
        
        // Check actor type - monsters typically have type "monster" in Dragonbane
        if (actor.type === 'monster') {
            this.debugLog(`Detected monster: ${actor.name} - hiding weapon durability`);
            return true;
        }
        
        // Additional check: monsters might be identified by other properties
        // Could also check for actor.system.monsterType or similar if needed
        
        this.debugLog(`Not a monster: ${actor.name} - showing weapon durability`);
        return false;
    }

    /**
     * Get parry rules list with conditional dragon highlighting
     */
    getParryRulesList(dragonRolled = false) {
        const dragonRule = dragonRolled ? 
            `<li><strong class="dragon-highlight">${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.dragon")}</strong></li>` :
            `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.dragon")}</li>`;
            
        return `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.reaction")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.success")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.piercing")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.monster")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.movement")}</li>
                ${dragonRule}`;
    }

    /**
     * Detect if a Dragon (natural 1) was rolled in the message
     */
    detectDragonRoll(message) {
        if (!message || !message.content) return false;
        
        // Look for Dragon indicators in the chat message
        // Common patterns: "Dragon", "rolled 1", "natural 1", etc.
        const dragonPatterns = [
            /\bdragon\b/i,
            /\brolled\s+1\b/i,
            /\bnatural\s+1\b/i,
            /\b1\s*\(dragon\)/i,
            /result[^>]*>\s*1\s*</i  // HTML result containing 1
        ];
        
        return dragonPatterns.some(pattern => pattern.test(message.content));
    }

    /**
     * Get rules for non-parry actions
     */
    getActionRules(action) {
        const ruleGenerators = {
            topple: () => this.getToppleRules(),
            disarm: () => this.getDisarmRules(),
            weakspot: () => this.getWeakspotRules()
        };

        return ruleGenerators[action] ? ruleGenerators[action]() : null;
    }

    /**
     * Get topple rules with weapon feature information
     */
    getToppleRules(weapon) {
        let content = "";
        
        // Check for topple weapon feature
        if (weapon && this.hasToppleFeature(weapon)) {
            const weaponName = weapon.name || game.i18n.localize("DRAGONBANE_ACTION_RULES.unknownWeapon");
            const toppleBonus = this.getToppleBonus(weapon);
            content += `<li><strong>${weaponName} ${game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.weaponFeature")}:</strong> ${toppleBonus}</li>`;
        }
        
        content += `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.noDamage")}</li>
                    <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.evadeRoll")}</li>
                    <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.cannotDefend")}</li>
                    <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.success")}</li>`;
        
        return content;
    }

    /**
     * Check if weapon has topple feature
     */
    hasToppleFeature(weapon) {
        if (!weapon || !weapon.system) return false;
        
        // Get both English and localized terms for toppling
        const englishTerm = "toppling";
        const localizedTerm = this.getLocalizedTerm("DoD.weaponFeatureTypes.toppling", "toppling").toLowerCase();
        
        // Check in features array (same location as "Long" feature)
        if (weapon.system.features && Array.isArray(weapon.system.features)) {
            return weapon.system.features.some(feature => {
                const featureLower = feature.toLowerCase();
                return featureLower === englishTerm || featureLower === localizedTerm;
            });
        }
        
        // Check if weapon has toppling feature method (alternative system approach)
        if (typeof weapon.hasWeaponFeature === 'function') {
            return weapon.hasWeaponFeature(englishTerm) || weapon.hasWeaponFeature(localizedTerm);
        }
        
        return false;
    }

    /**
     * Get topple bonus text for weapon
     */
    getToppleBonus(weapon) {
        if (!weapon || !this.hasToppleFeature(weapon)) {
            return "";
        }
        
        // Topple feature always gives +1 boon
        return game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.boonBonus");
    }

    /**
     * Get disarm rules
     */
    getDisarmRules() {
        return `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.noDamage")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.skillRoll")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.cannotDefend")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.twoHanded")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.success")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.limitations")}</li>`;
    }

    /**
     * Get weakspot rules
     */
    getWeakspotRules() {
        return `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.weakspot.piercing")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.weakspot.bane")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.weakspot.success")}</li>`;
    }

    /**
     * Display rules in chat
     */
    async displayRules(action, content, weapon = null, actorId = null) {
        const delay = this.getSetting('delay', 3000);
        
        const actionName = game.i18n.localize(`DRAGONBANE_ACTION_RULES.actions.${action}`);
        const speakerName = game.i18n.format("DRAGONBANE_ACTION_RULES.speakers.generic", { action: actionName });

        // Build the main content
        let chatContent = `<div class="dragonbane-action-rules"><ul>${content}</ul>`;
        
        // Add weapon broken button for parry if we have a weapon and it's not already broken
        if (action === 'parry' && weapon && actorId && !weapon.system?.broken) {
            chatContent += this.buildWeaponBrokenButton(weapon, actorId);
        }
        
        chatContent += `</div>`;

        setTimeout(async () => {
            try {
                await ChatMessage.create({
                    content: chatContent,
                    speaker: { alias: speakerName },
                    flags: { 
                        [this.moduleId]: { 
                            [this.flagsKey]: true 
                        } 
                    }
                });
            } catch (error) {
                console.error(`${this.moduleId} | Error creating chat message:`, error);
            }
        }, delay);
    }

    /**
     * Build the weapon broken button HTML
     */
    buildWeaponBrokenButton(weapon, actorId) {
        const buttonText = game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.buttonText");
        return `
            <div class="weapon-actions" style="margin-top: 8px; text-align: center;">
                <button class="chat-button weapon-roll mark-weapon-broken" 
                        data-weapon-id="${weapon.id}" 
                        data-actor-id="${actorId}">
                    ${buttonText}
                </button>
            </div>`;
    }

    /**
     * Handle marking weapon as broken
     */
    async markWeaponBroken(weaponId, actorId) {
        try {
            const actor = game.actors.get(actorId);
            if (!actor) {
                ui.notifications.error(game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.errors.actorNotFound"));
                return;
            }

            const weapon = actor.items.get(weaponId);
            if (!weapon) {
                ui.notifications.error(game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.errors.weaponNotFound"));
                return;
            }

            // Check permissions - player must own the actor or be GM
            if (!actor.isOwner && !game.user.isGM) {
                ui.notifications.warn(game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.errors.noPermission"));
                return;
            }

            // Check if weapon is already broken
            if (weapon.system.broken) {
                ui.notifications.info(game.i18n.format("DRAGONBANE_ACTION_RULES.weaponBroken.errors.alreadyBroken", { weaponName: weapon.name }));
                return;
            }

            // Confirm action
            const confirmed = await new Promise(resolve => {
                new Dialog({
                    title: game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.dialogTitle"),
                    content: `<p>${game.i18n.format("DRAGONBANE_ACTION_RULES.weaponBroken.dialogContent", { weaponName: weapon.name })}</p><p><em>${game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.dialogExplanation")}</em></p>`,
                    buttons: {
                        yes: {
                            icon: '<i class="fas fa-check"></i>',
                            label: game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.confirmButton"),
                            callback: () => resolve(true)
                        },
                        no: {
                            icon: '<i class="fas fa-times"></i>',
                            label: game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.cancelButton"),
                            callback: () => resolve(false)
                        }
                    },
                    default: "no",
                    close: () => resolve(false)
                }).render(true);
            });

            if (!confirmed) return;

            // Update weapon
            await weapon.update({"system.broken": true});
            
            // Show confirmation
            ui.notifications.info(game.i18n.format("DRAGONBANE_ACTION_RULES.weaponBroken.success", { weaponName: weapon.name }));
            
            this.debugLog(`Weapon ${weapon.name} marked as broken by ${game.user.name}`);

        } catch (error) {
            console.error(`${this.moduleId} | Error marking weapon broken:`, error);
            ui.notifications.error(game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.errors.updateFailed"));
        }
    }

    /**
     * Get setting value with fallback
     */
    getSetting(settingName, fallback) {
        try {
            return game.settings.get(this.moduleId, settingName);
        } catch (error) {
            console.warn(`${this.moduleId} | Failed to get setting ${settingName}:`, error);
            return fallback;
        }
    }

    /**
     * Debug logging
     */
    debugLog(message) {
        if (this.getSetting('debugMode', false)) {
            console.log(`${this.moduleId} | RulesDisplay: ${message}`);
        }
    }
}
