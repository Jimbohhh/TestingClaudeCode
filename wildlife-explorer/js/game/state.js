// Save data: discoveries, photos, quiz results, unlocked habitats and minigame stars.
(function (WE) {
  const KEY = 'wilddex-explorer-v1';
  const DISCOVERIES_TO_UNLOCK = 2;

  const fresh = () => ({
    discovered: {},        // id -> { at, sightings }
    photos: {},            // id -> jpeg data URL taken in the field
    quiz: {},              // id -> true when answered correctly
    stars: {},             // id -> best stars in minigame (0-3)
    unlocked: ['savanna'],
    habitat: 'savanna',
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
    foundCount(habId) {
      return WE.ANIMALS.filter(a => (!habId || a.habitat === habId) && this.isFound(a.id)).length;
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
    rank() {
      const n = this.foundCount();
      if (n >= 24) return 'Master Naturalist';
      if (n >= 16) return 'Senior Field Biologist';
      if (n >= 10) return 'Field Biologist';
      if (n >= 4) return 'Junior Ranger';
      return 'Rookie Explorer';
    },
  };
  State.DISCOVERIES_TO_UNLOCK = DISCOVERIES_TO_UNLOCK;
  WE.State = State;
})(window.WE);
