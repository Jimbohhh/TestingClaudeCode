// Habitats (real places on Earth) and creature powers.
(function (WE) {
  WE.HABITATS = [
    {
      id: 'savanna', name: 'Serengeti Savanna', region: 'Tanzania, East Africa', lat: -2.3, lon: 34.8,
      biome: 'Tropical grassland', climate: 'Warm all year with a wet season and a dry season',
      blurb: 'Endless golden grasslands dotted with flat-topped acacia trees. Every year about 1.5 million wildebeest, plus hundreds of thousands of zebras and gazelles, follow the rains here in the Great Migration.',
      facts: ['Serengeti comes from a Maasai word meaning "endless plains".', 'Mount Kilimanjaro, Africa\'s tallest mountain, rises nearby at 5,895 m.'],
      outfit: 'safari', color: '#d9a441', unlockAfter: null, ambient: ['zebra', 'gazelle'],
    },
    {
      id: 'rainforest', name: 'Amazon Rainforest', region: 'Brazil & neighbours, South America', lat: -3.5, lon: -62,
      biome: 'Tropical rainforest', climate: 'Hot and wet; it rains on most days',
      blurb: 'The largest tropical rainforest on Earth. It is home to roughly one in ten of all known species, and the mighty Amazon River winds through it.',
      facts: ['The Amazon River carries more water than any other river.', 'Rainforest trees release so much water vapour that they help make their own rain.'],
      outfit: 'jungle', color: '#3f8f4a', unlockAfter: 'savanna', ambient: ['capybara'],
    },
    {
      id: 'reef', name: 'Great Barrier Reef', region: 'Queensland, Australia', lat: -18.3, lon: 147.7,
      biome: 'Coral reef', climate: 'Warm, clear, shallow tropical sea',
      blurb: 'The world\'s largest coral reef system: about 2,900 reefs stretching over 2,300 km. Corals are tiny animals that build rocky skeletons, creating a giant underwater city.',
      facts: ['The reef is so big it can be seen from space.', 'Warming seas can cause coral bleaching, when corals lose the algae that feed them.'],
      outfit: 'diver', color: '#2fa3c7', unlockAfter: 'rainforest', underwater: true, ambient: ['reeffish'],
    },
    {
      id: 'desert', name: 'Sahara Desert', region: 'North Africa', lat: 23.4, lon: 12,
      biome: 'Hot desert', climate: 'Scorching days, chilly nights, and very little rain',
      blurb: 'The largest hot desert in the world, almost as big as the United States. Giant sand dunes, rocky plateaus and hidden oases are home to tough, clever animals.',
      facts: ['Some Sahara sand dunes are about 180 m tall.', 'About 6,000 years ago the Sahara was green, with lakes and grasslands!'],
      outfit: 'desert', color: '#e2b46a', unlockAfter: 'reef', ambient: [],
    },
    {
      id: 'arctic', name: 'Arctic Tundra & Sea Ice', region: 'Canadian Arctic & Greenland', lat: 72.5, lon: -78,
      biome: 'Tundra and polar sea ice', climate: 'Long, freezing winters and short, cool summers',
      blurb: 'A frozen world at the top of the planet. In summer the sun never sets; in winter it barely rises, and the northern lights dance across the sky.',
      facts: ['Ground called permafrost stays frozen all year, just below the surface.', 'Sea ice is like a floating hunting platform for polar bears.'],
      outfit: 'arctic', color: '#8fc3e0', unlockAfter: 'desert', ambient: [],
    },
    {
      id: 'forest', name: 'North Woods', region: 'Minnesota, USA & Ontario, Canada', lat: 47.9, lon: -91.5,
      biome: 'Mixed northern forest', climate: 'Snowy winters and warm summers, with colourful autumns',
      blurb: 'A land of thousands of lakes, tall pines, and maples that blaze red and orange in autumn. Wolves, bears and eagles all share this wild forest.',
      facts: ['Minnesota is called the "Land of 10,000 Lakes", and actually has more than 11,000.', 'Minnesota has the most wild wolves of any US state outside Alaska.'],
      outfit: 'forest', color: '#c0602a', unlockAfter: 'arctic', ambient: ['hare'],
    },
  ];
  WE.habitatById = id => WE.HABITATS.find(h => h.id === id);

  // Creature powers. `bio` explains the real biology behind each power.
  // kind drives the minigame effect; dur/cd are seconds.
  WE.POWERS = {
    roar:      { name: 'Mighty Roar', from: 'lion', kind: 'roar', dur: 2.5, cd: 12, color: '#d9a441', desc: 'Freezes nearby prey in place and sends threats running.', bio: 'A lion\'s roar carries up to 8 km, warning rivals to keep away.' },
    sprint:    { name: 'Cheetah Sprint', from: 'cheetah', kind: 'speed', dur: 3, cd: 9, mult: 2.1, color: '#f0c040', desc: 'A short burst of blistering speed.', bio: 'Cheetahs reach about 100 km/h, but only for short sprints before they overheat.' },
    stampede:  { name: 'Stampede', from: 'elephant', kind: 'shockwave', dur: 0.6, cd: 12, color: '#9a8f86', desc: 'A ground-shaking charge knocks threats far away.', bio: 'Elephants mock-charge, flaring their ears and stomping, to scare off lions.' },
    reach:     { name: 'Long Reach', from: 'giraffe', kind: 'reach', dur: 8, cd: 14, color: '#c8873a', desc: 'Grab food and prey from much farther away.', bio: 'A giraffe\'s long neck and 45 cm tongue reach leaves no one else can.' },
    pounce:    { name: 'Ambush Pounce', from: 'jaguar', kind: 'pounce', dur: 0.4, cd: 8, range: 300, color: '#d38b2a', desc: 'Leap onto the nearest prey in range.', bio: 'Jaguars stalk silently, then pounce, often from riverbanks.' },
    decoy:     { name: 'Decoy Call', from: 'toucan', kind: 'decoy', dur: 5, cd: 14, color: '#f28c28', desc: 'Throw a loud call that lures threats away from you.', bio: 'Toucans are noisy birds whose croaking calls echo through the forest.' },
    toxic:     { name: 'Toxic Skin', from: 'dartfrog', kind: 'toxic', dur: 6, cd: 15, color: '#f2c418', desc: 'Threats that touch you are stunned and back off.', bio: 'Dart frog toxins teach predators that bright colours mean "don\'t eat me".' },
    constrict: { name: 'Constrict', from: 'anaconda', kind: 'hold', dur: 4, cd: 12, radius: 190, color: '#6b7f3a', desc: 'Prey close to you are held still.', bio: 'Anacondas coil around prey and squeeze tighter every time it breathes out.' },
    sniff:     { name: 'Super Sniffer', from: 'polarbear', kind: 'sniff', dur: 12, cd: 16, color: '#cfe3ef', desc: 'Arrows point to the nearest prey.', bio: 'A polar bear can smell a seal nearly 1 km away, even under snow.' },
    camo:      { name: 'Winter Camouflage', from: 'arcticfox', kind: 'camo', dur: 6, cd: 14, color: '#e8eef2', desc: 'Become nearly invisible to threats and prey.', bio: 'The arctic fox turns white in winter to blend in with the snow.' },
    silent:    { name: 'Silent Flight', from: 'snowyowl', kind: 'silent', dur: 7, cd: 13, color: '#f4f2ec', desc: 'Prey can\'t hear you coming.', bio: 'Fringed edges on owl feathers muffle the sound of flapping.' },
    blubber:   { name: 'Blubber Buffer', from: 'harpseal', kind: 'shield', dur: 20, cd: 22, color: '#b7bcc2', desc: 'A blubber shield absorbs the next hit.', bio: 'Thick blubber keeps seals warm and cushions their bodies.' },
    anemone:   { name: 'Anemone Hideout', from: 'clownfish', kind: 'safezone', dur: 8, cd: 16, radius: 120, color: '#e86aa0', desc: 'Grow an anemone that threats won\'t enter.', bio: 'Clownfish shelter among stinging anemone tentacles, protected by their slime.' },
    shell:     { name: 'Shell Shield', from: 'seaturtle', kind: 'invuln', dur: 4, cd: 14, color: '#8a7a3a', desc: 'Nothing can hurt you for a few seconds.', bio: 'A sea turtle\'s hard shell protects it from most attacks.' },
    ink:       { name: 'Ink Cloud', from: 'octopus', kind: 'ink', dur: 5, cd: 12, radius: 200, color: '#2a2030', desc: 'Squirt ink that confuses threats and prey inside it.', bio: 'Octopuses squirt dark ink to confuse attackers while they jet away.' },
    echo:      { name: 'Echolocation', from: 'dolphin', kind: 'reveal', dur: 8, cd: 14, color: '#7fd6ff', desc: 'Sonar pulses reveal every animal around you.', bio: 'Dolphins click and listen for echoes to "see" with sound.' },
    ears:      { name: 'Radar Ears', from: 'fennec', kind: 'warn', dur: 10, cd: 14, color: '#f2c9b0', desc: 'Hear threats coming: arrows show where danger is.', bio: 'Fennec ears are so sensitive they hear insects moving under the sand.' },
    endurance: { name: 'Desert Endurance', from: 'camel', kind: 'recharge', dur: 8, cd: 20, color: '#c9a170', desc: 'Refills stamina and recharges your other powers fast.', bio: 'Camels can travel for days in the heat, living off the fat in their humps.' },
    ambush:    { name: 'Sand Ambush', from: 'viper', kind: 'burrow', dur: 6, cd: 12, color: '#d9b98a', desc: 'Bury yourself: prey wander close, and your next strike reaches farther.', bio: 'Horned vipers sink into sand with only their eyes showing, waiting for prey.' },
    leap:      { name: 'Kangaroo Leap', from: 'jerboa', kind: 'leap', dur: 0.6, cd: 5, color: '#d8b07a', desc: 'A huge, untouchable leap in the direction you\'re moving.', bio: 'Jerboas bound in long zig-zag hops to escape foxes and snakes.' },
    howl:      { name: 'Pack Howl', from: 'wolf', kind: 'allies', dur: 7, cd: 18, color: '#8d847a', desc: 'Two packmates join you and chase down prey.', bio: 'Wolves howl to gather their family pack before a hunt.' },
    zigzag:    { name: 'Zigzag Escape', from: 'deer', kind: 'dodge', dur: 8, cd: 15, charges: 3, color: '#a07048', desc: 'Automatically dodge the next 3 attacks.', bio: 'White-tailed deer escape by bounding in sudden zig-zags.' },
    eagleeye:  { name: 'Eagle Eye', from: 'baldeagle', kind: 'slowmo', dur: 5, cd: 15, color: '#efbb1d', desc: 'Everything else moves in slow motion.', bio: 'An eagle\'s super-sharp eyes track tiny movements from high in the sky.' },
    hibernate: { name: 'Fat Reserves', from: 'blackbear', kind: 'heal', dur: 0.5, cd: 25, color: '#5a4030', desc: 'Restore one heart.', bio: 'Black bears build up fat in autumn to live on all winter.' },
  };
})(window.WE);
