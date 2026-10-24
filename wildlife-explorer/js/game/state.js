// Save data: discoveries, photos, quiz results, unlocked habitats and minigame stars.
(function (WE) {
  const KEY = 'wilddex-explorer-v1';
  const DISCOVERIES_TO_UNLOCK = 2;

  const fresh = () => ({
    discovered: {},        // id -> { at, sightings }
    photos: {},            // id -> jpeg data URL taken in the field
    quiz: {},              // id -> true when answered correctly
    stars: {},             // id -> best stars in minigame (0-3)
    unlocked: ['savanna', 'hellcreek'],
    habitat: 'savanna',
    lastModern: 'savanna',
    lastEra: 'hellcreek',
    loadout: [],
    xp: 0,
    sound: true,
    seenIntro: false,
  });

  const State = {
    data: fresh(),
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) this.data = Object.assign(fresh(), JSON.parse(raw));
        // Saves from before the prehistoric expedition existed: open its first era.
        if (!this.data.unlocked.includes('hellcreek')) this.data.unlocked.push('hellcreek');
      } catch (e) { /* storage unavailable: play without saving */ }
      return this.data;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); }
      catch (e) {
        // Out of space: drop photos (they're the biggest part) and retry once.
        try { this.data.photos = {}; localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e2) { /* ignore */ }
      }
    },
    reset() { this.data = fresh(); this.save(); },

    isFound(id) { return !!this.data.discovered[id]; },
    foundCount(habId, world) {
      return WE.ANIMALS.filter(a => (!habId || a.habitat === habId) && (!world || a.world === world) && this.isFound(a.id)).length;
    },
    hasPower(pid) {
      const p = WE.POWERS[pid];
      return p && this.isFound(p.from);
    },
    unlockedPowers() { return Object.keys(WE.POWERS).filter(p => this.hasPower(p)); },
    isUnlocked(habId) { return this.data.unlocked.includes(habId); },

    // Record a discovery. Returns { isNew, unlockedHabitat }.
    discover(id, photo) {
      const d = this.data;
      const isNew = !d.discovered[id];
      if (isNew) d.discovered[id] = { at: Date.now(), sightings: 1 };
      else d.discovered[id].sightings++;
      if (photo) d.photos[id] = photo;
      d.xp += isNew ? 50 : 10;
      let unlockedHabitat = null;
      const a = WE.animalById(id);
      if (isNew && this.foundCount(a.habitat) >= DISCOVERIES_TO_UNLOCK) {
        const next = WE.HABITATS.find(h => h.unlockAfter === a.habitat);
        if (next && !this.isUnlocked(next.id)) { d.unlocked.push(next.id); unlockedHabitat = next; }
      }
      this.save();
      return { isNew, unlockedHabitat };
    },
    unlockRequirement(habId) {
      const h = WE.habitatById(habId);
      if (!h.unlockAfter) return null;
      const prev = WE.habitatById(h.unlockAfter);
      const have = this.foundCount(prev.id);
      return { prev, need: DISCOVERIES_TO_UNLOCK, have: Math.min(have, DISCOVERIES_TO_UNLOCK) };
    },
    rank(world) {
      world = world || 'modern';
      const total = WE.animalsIn(world).length;
      const f = this.foundCount(null, world) / total;
      const names = world === 'prehistoric'
        ? ['Fossil Hunter', 'Junior Paleontologist', 'Paleontologist', 'Senior Paleontologist', 'Master of Deep Time']
        : ['Rookie Explorer', 'Junior Ranger', 'Field Biologist', 'Senior Field Biologist', 'Master Naturalist'];
      return names[f >= 1 ? 4 : f >= 0.66 ? 3 : f >= 0.4 ? 2 : f >= 0.15 ? 1 : 0];
    },
  };
  State.DISCOVERIES_TO_UNLOCK = DISCOVERIES_TO_UNLOCK;
  WE.State = State;
})(window.WE);
