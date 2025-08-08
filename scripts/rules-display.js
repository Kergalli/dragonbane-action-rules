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
        
        // Shove attack type patterns
        this.allowedShoveAttacks = [];
        this.excludedShoveAttacks = [];
        
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
            
            // Initialize shove attack patterns
            this.initializeShoveAttackPatterns();
            
            this.debugLog(`Patterns initialized for language: ${game.i18n.lang}`);
            
        } catch (error) {
            console.warn(`${this.moduleId} | Error building localized patterns, falling back to English:`, error);
            this.initializeFallbackPatterns();
        }
    }

    /**
     * Initialize shove attack type patterns
     */
    initializeShoveAttackPatterns() {
        // Allowed attacks (damage-dealing melee attacks)
        this.allowedShoveAttacks = [
            this.getLocalizedTerm("DoD.attackTypes.normal", "attack"),
            this.getLocalizedTerm("DoD.attackTypes.stab", "stab"),
            this.getLocalizedTerm("DoD.attackTypes.slash", "slash"),
            this.getLocalizedTerm("DoD.attackTypes.weakpoint", "weakpoint"),
            "weak\\s+spot" // English fallback
        ].map(term => this.escapeRegex(term));

        // Excluded attacks (non-damage, non-melee, or defensive)
        this.excludedShoveAttacks = [
            this.getLocalizedTerm("DoD.attackTypes.topple", "topple"),
            this.getLocalizedTerm("DoD.attackTypes.disarm", "disarm"),
            this.getLocalizedTerm("DoD.attackTypes.parry", "parry"),
            this.getLocalizedTerm("DoD.attackTypes.ranged", "ranged"),
            this.getLocalizedTerm("DoD.attackTypes.throw", "throw")
        ].map(term => this.escapeRegex(term));

        this.debugLog(`Shove patterns initialized - Allowed: ${this.allowedShoveAttacks.length}, Excluded: ${this.excludedShoveAttacks.length}`);
    }

    /**
     * Check if message represents a spell attack
     */
    isSpellAttack(message) {
        // Extract item from UUID and check if it's a spell
        const item = this.extractItemFromMessage(message, 'spell');
        return item && item.type === 'spell';
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
        
        // Fallback shove patterns
        this.allowedShoveAttacks = ["attack", "stab", "slash", "weakpoint", "weak\\s+spot"];
        this.excludedShoveAttacks = ["topple", "disarm", "parry", "ranged", "throw", "power level"];
        
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

            // Handle EVADE separately - it's not part of combat flow
            this.handleEvadeSkillRoll(message);

            // Check for action pattern (special attacks)
            const actionMatch = content.match(this.actionPattern);
            if (actionMatch) {
                if (!this.isSuccessfulAction(content)) return;
                if (!this.shouldCreateRules(message)) return;

                this.processAction(message, actionMatch);
                return;
            }

            // Check for regular melee attacks (non-special)
            if (this.isSuccessfulAction(content)) {
                if (!this.shouldCreateRules(message)) return;
                this.processRegularMeleeAttack(message);
            }

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
        const messageAuthor = game.users.get(message.author || message.user); // v12+ compatibility
        if (messageAuthor && messageAuthor.active) {
            return game.user.id === (message.author || message.user);
        }

        // Fallback: let the first active user (by ID) create rules
        const firstActiveUser = game.users.find(user => user.active);
        return firstActiveUser && game.user.id === firstActiveUser.id;
    }

    /**
     * Get actor from speaker data, preferring token-specific data over base actor
     * This is the core utility method used by all other actor lookup methods
     */
    getActorFromSpeakerData(speakerData) {
        if (!speakerData) return null;
        
        // Try to get token-specific actor first (for scene-placed NPCs with overrides)
        if (speakerData.scene && speakerData.token) {
            const scene = game.scenes.get(speakerData.scene);
            const token = scene?.tokens.get(speakerData.token);
            if (token?.actor) {
                return token.actor;
            }
        }
        
        // Fallback to base actor
        if (speakerData.actor) {
            const baseActor = game.actors.get(speakerData.actor);
            return baseActor;
        }
        
        return null;
    }

    /**
     * Get actor from message speaker, preferring token-specific data over base actor
     */
    getActorFromMessage(message) {
        return this.getActorFromSpeakerData(message?.speaker);
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
            const actor = this.getActorFromMessage(message);
            const parryResult = this.getParryRules(weapon, dragonRolled, actor);
            ruleContent = parryResult.content;
            weapon = parryResult.weapon;
        } else if (normalizedAction === 'topple') {
            weapon = this.extractWeaponFromMessage(message);
            const actor = this.getActorFromMessage(message);
            ruleContent = this.getToppleRules(weapon, actor);
        } else if (normalizedAction === 'disarm') {
            weapon = this.extractWeaponFromMessage(message);
            const actor = this.getActorFromMessage(message);
            ruleContent = this.getDisarmRules(weapon, actor);
        } else if (normalizedAction === 'weakspot') {
            weapon = this.extractWeaponFromMessage(message);
            const actor = this.getActorFromMessage(message);
            ruleContent = this.getWeakspotRules(weapon, actor, message);
        } else {
            ruleContent = this.getActionRules(normalizedAction);
        }

        if (ruleContent) {
            await this.displayRules(normalizedAction, ruleContent, weapon, message.speaker);
        }
    }

    /**
     * Process regular melee attack for potential shove reminder
     */
    async processRegularMeleeAttack(message) {
        try {
            const actor = this.getActorFromMessage(message);
            
            // Check if this attack type is allowed for shove using the new pattern-based approach
            const shoveRule = this.getShoveRuleIfApplicable(message, actor);
            
            if (shoveRule) {
                await this.displayShoveRule(shoveRule);
            }

        } catch (error) {
            console.error(`${this.moduleId} | Error processing regular melee attack:`, error);
        }
    }

    /**
     * Check if attack type allows shove based on chat message content
     */
    isAttackTypeAllowedForShove(content) {
        if (!content || !this.allowedShoveAttacks || !this.excludedShoveAttacks) return false;

        // First check if any excluded attack types are present
        for (const excludedPattern of this.excludedShoveAttacks) {
            const regex = new RegExp(excludedPattern, 'i');
            if (regex.test(content)) {
                return false;
            }
        }

        // Then check if any allowed attack types are present
        for (const allowedPattern of this.allowedShoveAttacks) {
            const regex = new RegExp(allowedPattern, 'i');
            if (regex.test(content)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Handle EVADE skill rolls for PCs and NPCs (monsters get dodge rules via parry)
     */
    async handleEvadeSkillRoll(message) {
        try {
            // Check if dodge movement reminders are enabled
            if (!this.getSetting('enableDodgeMovementReminders', true)) return;

            // Only process successful actions
            if (!this.isSuccessfulAction(message.content)) return;

            // Check if this is from a monster - if so, skip (they get dodge rules via parry)
            const actor = this.getActorFromMessage(message);
            if (this.isMonsterActor(actor)) {
                return;
            }

            // Try UUID-based detection first (works for most PCs/NPCs)
            const skill = this.extractSkillFromMessage(message);
            if (skill && this.isEvadeSkill(skill)) {
                this.debugLog("EVADE skill roll detected via UUID");
            } 
            // Fallback to simple text pattern for NPCs without UUID
            else if (this.isEvadeSkillRollFromText(message.content)) {
                this.debugLog("EVADE skill roll detected via text pattern");
            }
            // No EVADE detected
            else {
                return;
            }

            // Prevent duplicate rules when multiple users are online
            if (!this.shouldCreateRules(message)) return;
            
            // Show dodge movement reminder
            await this.displayEvadeMovementRule();

        } catch (error) {
            console.error(`${this.moduleId} | Error handling EVADE skill roll:`, error);
        }
    }

    /**
     * Simplified EVADE text detection for PCs and NPCs only
     */
    isEvadeSkillRollFromText(content) {
        if (!content) return false;
        
        // Get localized evade term from Dragonbane system
        const evadeLocal = this.getLocalizedTerm("DoD.skills.evade", "evade").toLowerCase();
        
        // Simple pattern for PC/NPC evade rolls: "Skill roll for Evade succeeded"
        const evadePatterns = [evadeLocal, 'evade']
            .filter((term, index, array) => term && term.length > 0 && array.indexOf(term) === index)
            .map(term => this.escapeRegex(term))
            .join('|');
        
        // More flexible pattern - matches "Skill roll for [anything with evade] [success]"
        const skillRollPattern = new RegExp(`skill\\s+roll\\s+for\\s+.*?(?:${evadePatterns}).*?(?:succeeded|succeed|success)`, 'i');
        
        return skillRollPattern.test(content);
    }

    /**
     * Extract item information from chat message by type
     */
    extractItemFromMessage(message, itemType) {
        try {
            // Single flexible UUID pattern that handles various structures
            const UUID_PATTERN = /@UUID\[(?:[^\.]+\.)*Item\.([^\]]+)\]/;
            
            // Extract item ID from UUID
            const uuidMatch = message.content.match(UUID_PATTERN);
            let itemId = null;
            
            if (uuidMatch) {
                itemId = uuidMatch[1];
            }
            
            if (uuidMatch && itemId && message.speaker?.actor) {
                // Use token-specific actor instead of base actor
                const actor = this.getActorFromMessage(message);
                const item = actor?.items.get(itemId);
                if (item && item.type === itemType) {
                    return item;
                }
            }

            // For weapons, fallback to equipped weapons
            if (itemType === 'weapon' && message.speaker?.actor) {
                const actor = this.getActorFromMessage(message);
                const equippedWeapons = actor?.items.filter(i => 
                    i.type === "weapon" && (i.system?.worn === true || i.system?.mainHand === true)
                );
                if (equippedWeapons?.length === 1) return equippedWeapons[0];
            }

            return null;
        } catch (error) {
            console.error(`${this.moduleId} | Error extracting ${itemType}:`, error);
            return null;
        }
    }

    /**
     * Extract weapon information from chat message
     */
    extractWeaponFromMessage(message) {
        return this.extractItemFromMessage(message, 'weapon');
    }

    /**
     * Extract skill information from chat message
     */
    extractSkillFromMessage(message) {
        return this.extractItemFromMessage(message, 'skill');
    }

    /**
     * Check if skill is EVADE skill
     */
    isEvadeSkill(skill) {
        if (!skill || skill.type !== 'skill') {
            return false;
        }
        
        // Get localized EVADE term
        const evadeLocal = this.getLocalizedTerm("DoD.skills.evade", "evade").toLowerCase();
        const skillNameLower = skill.name.toLowerCase();
        
        // Check both English and localized versions
        return skillNameLower === 'evade' || skillNameLower === evadeLocal;
    }

    /**
     * Get parry rules with weapon durability and monster support
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
        
        content += this.getParryRulesList(dragonRolled, isMonster);
        return { content, weapon: isMonster ? null : weapon }; // Don't return weapon for monsters (prevents broken button)
    }

    /**
     * Check if the actor is a monster type
     */
    isMonsterActor(actor) {
        if (!actor) return false;
        
        // Check actor type - monsters typically have type "monster" in Dragonbane
        if (actor.type === 'monster') {
            this.debugLog(`Monster detected: ${actor.name}`);
            return true;
        }
        
        return false;
    }

    /**
     * Get parry rules list with conditional dragon highlighting, optional movement, and monster dodge support
     */
    getParryRulesList(dragonRolled = false, isMonster = false) {
        const dragonRule = dragonRolled ? 
            `<li><strong class="dragon-highlight">${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.dragon")}</strong></li>` :
            `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.dragon")}</li>`;
        
        let rules = `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.reaction")}</li>
                     <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.success")}</li>`;
        
        // Add dragon rule right after success (groups outcome rules together)
        rules += dragonRule;
        
        rules += `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.piercing")}</li>`;
        
        // Hide monster parry rule from monsters themselves (they don't need to know their attacks can't be parried)
        if (!isMonster) {
            rules += `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.monster")}</li>`;
        }
        
        // Add movement rule - different prefixes for monsters vs others
        if (this.getSetting('enableParryMovementReminders', true)) {
            if (isMonster) {
                // For monsters: add "If Parrying:" prefix since they have both dodge and parry options
                rules += `<li><strong>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.ifParrying")}</strong> ${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.movement")}</li>`;
            } else {
                // For PCs/NPCs: no prefix needed since parrying is separate from dodge
                rules += `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.movement")}</li>`;
            }
        }
        
        // Add dodge movement rule for monsters only (as last bullet point, adjacent to parry movement)
        if (isMonster && this.getSetting('enableDodgeMovementReminders', true)) {
            rules += `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.dodgeMovement")}</li>`;
        }
        
        return rules;
    }

    /**
     * Detect if a Dragon (natural 1) was rolled in the message
     */
    detectDragonRoll(message) {
        if (!message || !message.content) return false;
        
        // Get localized dragon term from the message "succedeed with a Dragon!"
        const dragonMessage = this.getLocalizedTerm("DoD.roll.dragon", "succedeed with a Dragon!");
        
        // Extract the actual dragon word (after "a " or before "!")
        const dragonWordMatch = dragonMessage.match(/\ba\s+(\w+)[!\s]*$/i) || dragonMessage.match(/(\w+)!?\s*$/);
        const dragonWord = dragonWordMatch ? dragonWordMatch[1] : "dragon";
        
        // Create pattern for the dragon word
        const dragonPattern = new RegExp(`\\b${this.escapeRegex(dragonWord)}\\b`, 'i');
        
        return dragonPattern.test(message.content);
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
     * Get topple rules with weapon feature information and monster-specific rules
     */
    getToppleRules(weapon, actor = null) {
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
        
        // Add monster-specific rule if targeting a monster
        const target = this.getCurrentTarget();
        if (target && this.isMonsterActor(target)) {
            content += `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.monsterRule")}</li>`;
        }
        
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
     * Get disarm rules with monster handling
     */
    getDisarmRules(weapon, actor = null) {
        // Check if targeting a monster
        const target = this.getCurrentTarget();
        if (target && this.isMonsterActor(target)) {
            return `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.monstersCannotBeDisarmed")}</li>`;
        }
        
        // Normal disarm rules for PCs/NPCs
        return `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.noDamage")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.skillRoll")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.cannotDefend")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.twoHanded")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.success")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.limitations")}</li>`;
    }

    /**
     * Get weakspot rules with optional shove
     */
    getWeakspotRules(weapon, actor = null, message = null) {
        let content = `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.weakspot.piercing")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.weakspot.bane")}</li>
                <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.weakspot.success")}</li>`;
        
        // Add shove rule if applicable (weakspot is a damage-dealing attack)
        if (message) {
            content += this.getShoveRuleIfApplicable(message, actor);
        }
        
        return content;
    }

    /**
     * Get shove rule if conditions are met using pattern-based detection
     */
    getShoveRuleIfApplicable(message, actor) {
        // Check if shove reminders are enabled
        if (!this.getSetting('enableShoveReminders', true)) {
            return "";
        }

        // Check if this is a spell attack (spells cannot shove)
        if (this.isSpellAttack(message)) {
            return "";
        }

        // Check if this attack type is allowed for shove using pattern-based detection
        if (!this.isAttackTypeAllowedForShove(message.content)) {
            return "";
        }

        // Check if actor is a monster (monsters cannot shove)
        if (!actor || this.isMonsterActor(actor)) {
            return "";
        }

        // Get current target to check STR comparison
        const target = this.getCurrentTarget();
        if (!target || this.isMonsterActor(target)) {
            // No target or target is a monster (monsters cannot be shoved)
            return "";
        }

        // Only show shove rule if attacker can actually shove the target
        if (this.canShove(actor, target)) {
            const targetName = target.name || game.i18n.localize("DRAGONBANE_ACTION_RULES.shove.defaultTarget");
            return `<li>${game.i18n.format("DRAGONBANE_ACTION_RULES.shove.available", { targetName: targetName })}</li>`;
        }

        // Don't show anything if shove is not available
        return "";
    }

    /**
     * Get current target actor with token-specific data
     */
    getCurrentTarget() {
        const targets = Array.from(game.user.targets);
        if (targets.length !== 1) return null;
        
        const targetToken = targets[0];
        
        // Use token's actor (which includes token-specific overrides) instead of base actor
        const tokenActor = targetToken.actor;
        
        return tokenActor;
    }

    /**
     * Extract STR damage bonus from actor with Dragonbane key support
     */
    extractStrDamageBonus(actor) {
        if (!actor || !actor.system) {
            return 0;
        }

        // Use the provided actor directly (it might be token-specific data)
        const bonusValue = actor.system?.damageBonus?.str?.value;
        
        if (!bonusValue) {
            return 0;
        }
        
        // Handle different formats including Dragonbane internal keys
        if (typeof bonusValue === 'number') {
            return bonusValue;
        }
        
        if (typeof bonusValue === 'string') {
            // Handle "none" case (no damage bonus)
            if (bonusValue.toLowerCase() === 'none' || bonusValue === '' || bonusValue === '0') {
                return 0;
            }
            
            // Handle internal Dragonbane dice keys: "d4", "d6", "d8", "d10", "d12"
            const diceKeyMatch = bonusValue.match(/^d(\d+)$/i);
            if (diceKeyMatch) {
                return parseInt(diceKeyMatch[1]);
            }
            
            // Handle display format: "D6", "D4", etc.
            const displayMatch = bonusValue.match(/^D(\d+)$/i);
            if (displayMatch) {
                return parseInt(displayMatch[1]);
            }
            
            // Handle numeric strings: "4", "6", etc.
            const numericMatch = bonusValue.match(/^(\d+)$/);
            if (numericMatch) {
                return parseInt(numericMatch[1]);
            }
            
            return 0;
        }
        
        return 0;
    }

    /**
     * Check if attacker can shove defender based on STR damage bonus
     */
    canShove(attacker, defender) {
        const attackerBonus = this.extractStrDamageBonus(attacker);
        const defenderBonus = this.extractStrDamageBonus(defender);
        
        this.debugLog(`Shove check: ${attacker.name} D${attackerBonus} vs ${defender.name} D${defenderBonus}`);
        
        return attackerBonus >= defenderBonus;
    }

    /**
     * Display rules in chat with monster-aware speaker names
     */
    async displayRules(action, content, weapon = null, speaker = null) {
        const delay = this.getSetting('delay', 3000);
        
        // Get actor to check if it's a monster (for speaker name)
        const actor = this.getActorFromSpeakerData(speaker);
        const isMonster = this.isMonsterActor(actor);
        
        // Determine speaker name
        let speakerName;
        if (action === 'parry' && isMonster) {
            speakerName = game.i18n.localize("DRAGONBANE_ACTION_RULES.speakers.dodgeAndParry");
        } else {
            const actionName = game.i18n.localize(`DRAGONBANE_ACTION_RULES.actions.${action}`);
            speakerName = game.i18n.format("DRAGONBANE_ACTION_RULES.speakers.generic", { action: actionName });
        }

        // Build the main content
        let chatContent = `<div class="dragonbane-action-rules"><ul>${content}</ul>`;
        
        // Add weapon broken button for parry if we have a weapon and it's not already broken
        if (action === 'parry' && weapon && speaker && !weapon.system?.broken) {
            chatContent += this.buildWeaponBrokenButton(weapon, speaker);
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
     * Display evade movement rule for successful EVADE rolls
     */
    async displayEvadeMovementRule() {
        const delay = this.getSetting('delay', 3000);
        const speakerName = game.i18n.localize("DRAGONBANE_ACTION_RULES.speakers.evade");
        const content = `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.evade.movementAvailable")}</li>`;

        // Build the content with same styling as rule cards
        const chatContent = `<div class="dragonbane-action-rules"><ul>${content}</ul></div>`;

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
                console.error(`${this.moduleId} | Error creating evade movement chat message:`, error);
            }
        }, delay);
    }

    /**
     * Display shove rule for regular melee attacks
     */
    async displayShoveRule(content) {
        const delay = this.getSetting('delay', 3000);
        const speakerName = game.i18n.localize("DRAGONBANE_ACTION_RULES.speakers.shove");

        // Build the content with same styling as rule cards
        const chatContent = `<div class="dragonbane-action-rules"><ul>${content}</ul></div>`;

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
                console.error(`${this.moduleId} | Error creating shove chat message:`, error);
            }
        }, delay);
    }

    /**
     * Build the weapon broken button HTML
     */
    buildWeaponBrokenButton(weapon, speaker) {
        const buttonText = game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.buttonText");
        return `
            <div class="weapon-actions" style="margin-top: 8px; text-align: center;">
                <button class="chat-button weapon-roll mark-weapon-broken" 
                        data-weapon-id="${weapon.id}" 
                        data-actor-id="${speaker.actor || ''}"
                        data-scene-id="${speaker.scene || ''}"
                        data-token-id="${speaker.token || ''}">
                    ${buttonText}
                </button>
            </div>`;
    }

    /**
     * Handle marking weapon as broken
     */
    async markWeaponBroken(weaponId, actorId, sceneId = null, tokenId = null) {
        try {
            // Build speaker data object and use consolidated lookup
            const speakerData = {
                actor: actorId,
                scene: sceneId,
                token: tokenId
            };
            
            const actor = this.getActorFromSpeakerData(speakerData);
            
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
