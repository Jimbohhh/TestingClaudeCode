// WildDex species data. Facts are written for young explorers and kept to
// well-established figures. `art` describes how the sprite engine draws each animal.
(function (WE) {
  const U = WE.U;

  // Shared head marking helpers -------------------------------------------------
  const tearMarks = (ctx, h) => {
    ctx.strokeStyle = '#1a120c'; ctx.lineWidth = h.h * 0.06; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(h.len * 0.55, -h.h * 0.1);
    ctx.quadraticCurveTo(h.len * 0.62, h.h * 0.1, h.len * 0.82, h.h * 0.2);
    ctx.stroke();
  };
  const whiteFaceMask = color => (ctx, h) => {
    ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = color;
    U.ellipse(ctx, h.len * 0.85, h.h * 0.18, h.len * 0.3, h.h * 0.24, 0); ctx.fill();
    U.ellipse(ctx, h.len * 0.52, -h.h * 0.32, h.len * 0.09, h.h * 0.06, 0); ctx.fill();
    ctx.restore();
  };
  const foxFace = (cheek, mask) => (ctx, h) => {
    ctx.save(); ctx.fillStyle = cheek; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(h.len * 0.4, h.h * 0.05); ctx.quadraticCurveTo(h.len * 0.75, h.h * 0.05, h.len * 1.0, h.h * 0.12);
    ctx.quadraticCurveTo(h.len * 0.7, h.h * 0.45, h.len * 0.3, h.h * 0.4); ctx.fill();
    if (mask) { ctx.fillStyle = mask; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(h.len * 0.5, -h.h * 0.15); ctx.lineTo(h.len * 0.85, h.h * 0.02); ctx.lineTo(h.len * 0.5, 0); ctx.fill(); }
    ctx.restore();
  };

  const A = [
    // ============================ SAVANNA ============================
    {
      id: 'lion', name: 'African Lion', sci: 'Panthera leo', habitat: 'savanna', cls: 'Mammal', diet: 'Carnivore',
      length: '1.7 – 2.5 m (plus tail)', weight: '120 – 250 kg', lifespan: '10 – 14 years', speed: '≈ 80 km/h (short bursts)',
      status: 'VU', range: 'Sub-Saharan Africa; a small group in India',
      blurb: 'The only cat that lives in big family groups called prides. Lionesses usually hunt together, while males guard the pride\'s territory.',
      facts: [
        'A lion\'s roar can be heard up to 8 km away.',
        'Lions rest for up to 20 hours a day to save energy in the heat.',
        'A male\'s dark mane can show other lions how healthy and strong he is.',
        'Lionesses often hunt as a team, spreading out to surround prey.',
      ],
      eats: ['zebra', 'gazelle'], eatenBy: [],
      quiz: { q: 'How far away can a lion\'s roar be heard?', a: ['About 100 m', 'Up to 8 km', 'Up to 80 km'], correct: 1 },
      power: 'roar', role: 'hunt', targets: ['zebra', 'gazelle'], threats: ['hyena'], speedStat: 1.05, sizeStat: 1.15, wary: 0.25, layer: 'ground', worldScale: 0.8,
      art: {
        kind: 'quad', len: 120, depth: 50, leg: 52, legW: 15, feet: 'pad', slope: 6, tuck: 3,
        neck: { len: 26, angle: 30, w: 40 },
        head: { len: 46, h: 38, snout: 0.38, snoutH: 0.55, ears: { type: 'round', size: 0.8, x: 0.25 }, whiskers: true, eyeR: 3.3, noseSize: 1.1 },
        tail: { len: 85, w: 6, type: 'tuft', droop: 55, tip: '#3b2412' },
        mane: { type: 'lion', color: '#8a5a24', dark: '#4a2c12', size: 1.25 },
        colors: { base: '#c99a5b', belly: '#ecd2a4', nose: '#5a3324', eye: '#b8862a', muzzle: '#efdcbc', earInner: '#5b3a22' },
      },
    },
    {
      id: 'cheetah', name: 'Cheetah', sci: 'Acinonyx jubatus', habitat: 'savanna', cls: 'Mammal', diet: 'Carnivore',
      length: '1.1 – 1.5 m (plus tail)', weight: '21 – 72 kg', lifespan: '10 – 12 years', speed: 'up to ≈ 100 km/h',
      status: 'VU', range: 'Eastern & southern Africa; a few in Iran',
      blurb: 'The fastest land animal on Earth. A cheetah creeps close through the grass, then sprints for less than a minute to catch its prey.',
      facts: [
        'A cheetah can go from 0 to about 95 km/h in roughly 3 seconds.',
        'Its claws only partly pull in, so they grip the ground like running spikes.',
        'The black "tear marks" on its face may cut down sun glare when it hunts by day.',
        'Its long tail works like a rudder so it can turn sharply mid-sprint.',
      ],
      eats: ['gazelle'], eatenBy: [],
      quiz: { q: 'What helps a cheetah steer during a high-speed chase?', a: ['Its long tail', 'Its spots', 'Its whiskers'], correct: 0 },
      power: 'sprint', role: 'hunt', targets: ['gazelle'], threats: ['lion', 'hyena'], speedStat: 1.35, sizeStat: 0.95, wary: 0.5, layer: 'ground', worldScale: 0.7,
      art: {
        kind: 'quad', len: 112, depth: 40, leg: 64, legW: 10, feet: 'pad', slope: 4, tuck: 12, arch: 3,
        neck: { len: 26, angle: 28, w: 26 },
        head: { len: 34, h: 28, snout: 0.32, snoutH: 0.55, ears: { type: 'round', size: 0.7, x: 0.25 }, whiskers: true, eyeR: 2.8, markings: tearMarks },
        tail: { len: 90, w: 5, type: 'thin', droop: 50, curl: 0.9, rings: '#1a120c', tip: '#f4ead2' },
        pattern: { type: 'spots', color: '#1e140c', size: 3.2 },
        colors: { base: '#d9ad62', belly: '#f6ebcf', nose: '#2a1a12', eye: '#b98a2c', earInner: '#3a2616' },
      },
    },
    {
      id: 'elephant', name: 'African Bush Elephant', sci: 'Loxodonta africana', habitat: 'savanna', cls: 'Mammal', diet: 'Herbivore',
      length: 'up to 4 m tall at the shoulder', weight: 'up to 6,000 kg', lifespan: '60 – 70 years', speed: '≈ 40 km/h',
      status: 'EN', range: 'Savannas and forests across sub-Saharan Africa',
      blurb: 'The largest land animal alive. Elephants live in family herds led by the oldest female, called the matriarch.',
      facts: [
        'Its trunk has tens of thousands of muscles and can pick up a single blade of grass.',
        'Flapping its huge ears helps cool its blood on hot days.',
        'An adult can eat around 150 kg of plants in a single day.',
        'Elephants "talk" with low rumbles that can travel several kilometres through the ground.',
      ],
      eats: [], eatenBy: ['lion'],
      quiz: { q: 'What do elephants use their big ears for?', a: ['Digging', 'Cooling down', 'Storing water'], correct: 1 },
      power: 'stampede', role: 'survive', targets: ['acacia', 'grass'], threats: ['lion'], speedStat: 0.85, sizeStat: 1.6, wary: 0.15, layer: 'ground', worldScale: 1.35,
      art: {
        kind: 'quad', len: 150, depth: 92, leg: 78, legW: 26, columnar: true, feet: 'pad', footW: 32, slope: 8, arch: 6, texture: 'skin',
        neck: { len: 10, angle: 10, w: 70 },
        head: { len: 64, h: 70, snout: 0.25, snoutH: 0.7, stop: 0.05, ears: null, eyeR: 3.4, eyeX: 0.62, eyeY: 0.05, noseType: 'none', mouthY: 0.4 },
        tail: { len: 55, w: 4, type: 'tuft', droop: 75, tip: '#2e2a26' },
        trunk: { len: 105 }, bigEars: true, tusks: true,
        colors: { base: '#8c8580', nose: '#3a3430', eye: '#3a2614' },
      },
    },
    {
      id: 'giraffe', name: 'Masai Giraffe', sci: 'Giraffa tippelskirchi', habitat: 'savanna', cls: 'Mammal', diet: 'Herbivore',
      length: 'up to 5.5 m tall', weight: '700 – 1,900 kg', lifespan: '20 – 25 years', speed: '≈ 55 km/h',
      status: 'EN', range: 'Kenya and Tanzania, East Africa',
      blurb: 'The tallest animal on Earth. Giraffes browse leaves from the tops of thorny acacia trees that other animals can\'t reach.',
      facts: [
        'A giraffe\'s neck has seven bones — the same number as yours! Each one is just much longer.',
        'Its dark tongue can be about 45 cm long and wraps around thorny branches.',
        'Giraffes sleep very little, often in short naps of just a few minutes.',
        'Every giraffe\'s patch pattern is unique, like a fingerprint.',
      ],
      eats: [], eatenBy: ['lion'],
      quiz: { q: 'How many bones are in a giraffe\'s neck?', a: ['7', '24', '70'], correct: 0 },
      power: 'reach', role: 'survive', targets: ['acacia'], threats: ['lion'], speedStat: 1.05, sizeStat: 1.45, wary: 0.35, layer: 'ground', worldScale: 1.6,
      art: {
        kind: 'quad', len: 100, depth: 54, leg: 112, legW: 10, feet: 'hoof', slope: 26, tuck: 4,
        neck: { len: 120, angle: 64, w: 30 },
        head: { len: 44, h: 22, snout: 0.5, snoutH: 0.55, ears: { type: 'leaf', size: 1.1, x: 0.2, tilt: -10 }, eyeR: 3.2, eyeX: 0.42 },
        tail: { len: 70, w: 3, type: 'tuft', droop: 80, tip: '#1d140c' },
        ossicones: true, mane: { type: 'upright', color: '#6b3d1c', size: 6 },
        pattern: { type: 'patches', color: '#7a3f17', line: '#efdcb4', size: 15 },
        colors: { base: '#d9b47a', belly: '#f3e4c0', nose: '#3a2618', eye: '#2a1a0e', hoof: '#2a1d14' },
      },
    },

    // ============================ RAINFOREST ============================
    {
      id: 'jaguar', name: 'Jaguar', sci: 'Panthera onca', habitat: 'rainforest', cls: 'Mammal', diet: 'Carnivore',
      length: '1.1 – 1.9 m (plus tail)', weight: '56 – 96 kg', lifespan: '12 – 15 years', speed: '≈ 80 km/h (short bursts)',
      status: 'NT', range: 'Mexico to northern Argentina, especially the Amazon',
      blurb: 'The biggest cat in the Americas. Jaguars love water and are powerful swimmers that hunt along rivers.',
      facts: [
        'For its size, the jaguar has one of the strongest bites of any big cat — strong enough to crack turtle shells.',
        'Jaguar rosettes have small spots inside them; leopard rosettes usually don\'t.',
        'Some jaguars are so dark they look black, but their rosettes are still there.',
        'Jaguars catch fish, caimans and capybaras along rivers.',
      ],
      eats: ['capybara', 'anaconda'], eatenBy: [],
      quiz: { q: 'How can you tell a jaguar\'s rosettes from a leopard\'s?', a: ['They are square', 'They have spots inside', 'They are striped'], correct: 1 },
      power: 'pounce', role: 'hunt', targets: ['capybara'], threats: ['anaconda'], speedStat: 1.1, sizeStat: 1.05, wary: 0.6, layer: 'ground', worldScale: 0.72,
      art: {
        kind: 'quad', len: 116, depth: 50, leg: 46, legW: 15, feet: 'pad', slope: 2, tuck: 4,
        neck: { len: 22, angle: 22, w: 36 },
        head: { len: 42, h: 36, snout: 0.33, snoutH: 0.58, ears: { type: 'round', size: 0.65, x: 0.25 }, whiskers: true, eyeR: 3.2 },
        tail: { len: 70, w: 7, type: 'thin', droop: 60, tip: '#1a120c' },
        pattern: { type: 'rosettes', color: '#1b120c', size: 5.2, center: 'rgba(170,95,25,0.45)' },
        colors: { base: '#d39b4a', belly: '#f3e2c0', nose: '#4a2a1c', eye: '#c9a032', earInner: '#2a1a10' },
      },
    },
    {
      id: 'toucan', name: 'Toco Toucan', sci: 'Ramphastos toco', habitat: 'rainforest', cls: 'Bird', diet: 'Omnivore (mostly fruit)',
      length: '55 – 65 cm', weight: '0.5 – 0.9 kg', lifespan: 'about 20 years', speed: 'short, swooping flights',
      status: 'LC', range: 'Central & eastern South America, including Amazon forest edges',
      blurb: 'Famous for its enormous orange bill. Toucans hop through the treetops eating fruit, and help forests grow by spreading seeds.',
      facts: [
        'Its bill can be about a third of its body length but is light, like a honeycomb inside.',
        'Blood vessels in the bill help the toucan let out heat when it\'s hot.',
        'Toucans sleep with their bill tucked over their back and tail folded over.',
        'By swallowing fruit and dropping seeds far away, toucans plant new trees.',
      ],
      eats: ['fruit'], eatenBy: ['harpy', 'jaguar'],
      quiz: { q: 'Why is a toucan\'s huge bill so light?', a: ['It is hollow like a honeycomb inside', 'It is made of feathers', 'It is full of air bubbles from fruit'], correct: 0 },
      power: 'decoy', role: 'survive', targets: ['fruit'], threats: ['harpy'], speedStat: 1.1, sizeStat: 0.75, wary: 0.55, layer: 'tree', worldScale: 0.8, flyer: true,
      art: {
        kind: 'bird', size: 26, bodyW: 1.2, bodyH: 0.62, headR: 0.45, tailLen: 0.95, legLen: 10, stance: -40, beak: 'toucan', beakLen: 3.0, beakH: 1.0, eyeR: 0.14, eyeX: 0.3,
        colors: { body: '#121212', base: '#1c1c1c', wing: '#161616', head: '#141414', throat: '#f7f1e3', eyeRing: '#3b8fd6', eye: '#2a1a0a', legs: '#5c6ea8', tail: '#101010' },
      },
    },
    {
      id: 'dartfrog', name: 'Dyeing Poison Dart Frog', sci: 'Dendrobates tinctorius', habitat: 'rainforest', cls: 'Amphibian', diet: 'Insectivore',
      length: '3.5 – 6 cm', weight: 'about 8 g', lifespan: '5 – 10 years', speed: 'quick hops',
      status: 'LC', range: 'Guiana Shield, north-eastern Amazon',
      blurb: 'A tiny frog with dazzling colours that shout "I\'m poisonous — don\'t eat me!" to any would-be predator.',
      facts: [
        'Its bright colours are a warning sign. Scientists call this aposematism.',
        'Its poison comes from the ants and mites it eats. Frogs raised in zoos aren\'t poisonous.',
        'Fathers carry their tadpoles on their backs to tiny pools of water in plants.',
        'Its skin chemicals are so special that scientists study them to make new medicines.',
      ],
      eats: ['ant'], eatenBy: ['snake'],
      quiz: { q: 'Where does a poison dart frog get its poison?', a: ['From the sun', 'From the insects it eats', 'From drinking river water'], correct: 1 },
      power: 'toxic', role: 'hunt', targets: ['ant'], threats: ['snake'], speedStat: 0.9, sizeStat: 0.5, wary: 0.3, layer: 'ground', worldScale: 0.6,
      art: {
        kind: 'frog', size: 26,
        pattern: { type: 'blotches', color: '#0c0c10', size: 5 },
        colors: { body: '#f2c418', base: '#f2c418', legs: '#2b6fd6', eye: '#050505' },
      },
    },
    {
      id: 'anaconda', name: 'Green Anaconda', sci: 'Eunectes murinus', habitat: 'rainforest', cls: 'Reptile', diet: 'Carnivore',
      length: 'commonly 4 – 5 m, sometimes more', weight: 'can exceed 100 kg', lifespan: 'about 10 years in the wild', speed: 'fast in water, slow on land',
      status: 'LC', range: 'Amazon & Orinoco river basins',
      blurb: 'The heaviest snake on Earth. Anacondas lurk in swamps and rivers and squeeze their prey instead of using venom.',
      facts: [
        'Its eyes and nostrils sit on top of its head so it can see and breathe while almost hidden underwater.',
        'Anacondas don\'t lay eggs — they give birth to live babies.',
        'Females are much bigger than males.',
        'In 2024 scientists announced a second green anaconda species, the northern green anaconda!',
      ],
      eats: ['capybara'], eatenBy: ['jaguar'],
      quiz: { q: 'How does an anaconda catch its prey?', a: ['With venom', 'By squeezing (constricting)', 'By chasing it for hours'], correct: 1 },
      power: 'constrict', role: 'hunt', targets: ['capybara'], threats: ['jaguar'], speedStat: 0.8, sizeStat: 1.2, wary: 0.2, layer: 'ground', worldScale: 1.0,
      art: {
        kind: 'snake', len: 240, w: 15, spots: 'ringed', texture: 'scales', scaleSize: 3,
        colors: { body: '#556b2f', base: '#556b2f', belly: '#c8b25a', spots: '#141810', spotCenter: '#7a6a2a', eye: '#d0a640' },
      },
    },

    // ============================ CORAL REEF ============================
    {
      id: 'clownfish', name: 'Orange Clownfish', sci: 'Amphiprion percula', habitat: 'reef', cls: 'Fish', diet: 'Omnivore',
      length: '8 – 11 cm', weight: 'about 0.25 kg or less', lifespan: '6 – 10 years', speed: 'darting swimmer',
      status: 'LC', range: 'Northern Great Barrier Reef, New Guinea & nearby islands',
      blurb: 'A small, bold fish that lives safely among the stinging tentacles of sea anemones.',
      facts: [
        'A special slimy coating stops the anemone\'s tentacles from stinging it.',
        'All clownfish hatch as males. The biggest one in a group can turn into the female!',
        'Clownfish and anemones help each other: the fish chases away anemone-eating fish.',
        'They rarely swim more than a few metres from their home anemone.',
      ],
      eats: ['plankton'], eatenBy: ['grouper'],
      quiz: { q: 'Why don\'t anemones sting clownfish?', a: ['Clownfish are too fast', 'Clownfish have a protective slime coat', 'Anemones are asleep'], correct: 1 },
      power: 'anemone', role: 'survive', targets: ['plankton'], threats: ['grouper'], speedStat: 1.0, sizeStat: 0.5, wary: 0.6, layer: 'water', worldScale: 0.7, swimmer: true,
      art: {
        kind: 'fish', len: 60, h: 30, shape: 0.7, tailW: 0.45, dorsalH: 0.35, eyeR: 0.11, eyeX: 0.34,
        bands: [0.32, 0.02, -0.33],
        colors: { body: '#f26a1b', base: '#f26a1b', fins: '#f07a2a', band: '#ffffff', bandEdge: '#1a1a1a', eye: '#3a1a0a' },
      },
    },
    {
      id: 'seaturtle', name: 'Green Sea Turtle', sci: 'Chelonia mydas', habitat: 'reef', cls: 'Reptile', diet: 'Herbivore',
      length: 'shell 0.8 – 1.2 m', weight: '70 – 190 kg', lifespan: '70+ years', speed: 'cruises ≈ 3 km/h, bursts much faster',
      status: 'LC', range: 'Tropical & subtropical oceans worldwide',
      blurb: 'A gentle grazer that munches seagrass and algae. In 2025 it was moved from Endangered to Least Concern thanks to decades of protection — a real conservation success story!',
      facts: [
        'It is named "green" for the colour of its body fat, which comes from its seagrass diet.',
        'Females swim thousands of kilometres back to the beach where they hatched to lay eggs.',
        'Sea turtles can find their way using Earth\'s magnetic field.',
        'A resting turtle can stay underwater for hours without a breath.',
      ],
      eats: ['seagrass'], eatenBy: ['tigershark'],
      quiz: { q: 'Why is the green sea turtle called "green"?', a: ['Its shell is bright green', 'Its body fat is green from eating seagrass', 'It glows green at night'], correct: 1 },
      power: 'shell', role: 'survive', targets: ['seagrass'], threats: ['tigershark'], speedStat: 0.85, sizeStat: 1.0, wary: 0.2, layer: 'water', worldScale: 1.0, swimmer: true,
      art: {
        kind: 'turtle', size: 46,
        colors: { shell: '#6b5a2e', skin: '#8a8a5a', plastron: '#e8dcae', base: '#6b5a2e' },
      },
    },
    {
      id: 'octopus', name: 'Day Octopus', sci: 'Octopus cyanea', habitat: 'reef', cls: 'Mollusc', diet: 'Carnivore',
      length: 'arm span up to about 1 m', weight: 'up to ≈ 6 kg', lifespan: 'about 1 year', speed: 'jets away in a flash',
      status: 'LC', range: 'Indian & Pacific Ocean reefs, including the Great Barrier Reef',
      blurb: 'A clever, colour-changing hunter that, unlike most octopuses, hunts during the day.',
      facts: [
        'An octopus has three hearts and blue blood.',
        'It can change both its colour and skin texture in under a second.',
        'Its suckers can taste what they touch.',
        'Octopuses can solve puzzles and squeeze through any gap bigger than their beak.',
      ],
      eats: ['crab'], eatenBy: ['moray', 'reefshark'],
      quiz: { q: 'How many hearts does an octopus have?', a: ['One', 'Three', 'Eight'], correct: 1 },
      power: 'ink', role: 'hunt', targets: ['crab'], threats: ['moray'], speedStat: 1.0, sizeStat: 0.8, wary: 0.65, layer: 'water', worldScale: 0.8, swimmer: true,
      art: {
        kind: 'octopus', size: 30,
        colors: { body: '#a0522d', base: '#a0522d', mottle: '#d9a066', suckers: '#f0d2bf' },
      },
    },
    {
      id: 'dolphin', name: 'Indo-Pacific Bottlenose Dolphin', sci: 'Tursiops aduncus', habitat: 'reef', cls: 'Mammal', diet: 'Carnivore',
      length: '2 – 2.7 m', weight: 'up to 230 kg', lifespan: '40+ years', speed: 'bursts over 30 km/h',
      status: 'NT', range: 'Warm coastal waters from South Africa to Australia',
      blurb: 'A playful, chatty mammal that breathes air and "sees" with sound. Dolphins live in groups called pods.',
      facts: [
        'Dolphins find food with echolocation: they click and listen for the echoes.',
        'Each dolphin has its own signature whistle, a bit like a name.',
        'In Shark Bay, Australia, some of these dolphins wear sea sponges on their snouts as tools while foraging.',
        'They rest one half of their brain at a time so they can keep surfacing to breathe.',
      ],
      eats: ['reeffish'], eatenBy: ['tigershark'],
      quiz: { q: 'What is echolocation?', a: ['Finding things by listening to echoes of sounds', 'Swimming in circles', 'Seeing in the dark with glowing eyes'], correct: 0 },
      power: 'echo', role: 'hunt', targets: ['reeffish'], threats: ['tigershark'], speedStat: 1.3, sizeStat: 1.2, wary: 0.4, layer: 'water', worldScale: 1.15, swimmer: true,
      art: {
        kind: 'cetacean', len: 190, h: 46, beak: true, dorsalX: -0.02, dorsalH: 0.6,
        colors: { body: '#7c8a96', back: '#56636f', belly: '#d9dfe4', base: '#7c8a96' },
      },
    },

    // ============================ DESERT ============================
    {
      id: 'fennec', name: 'Fennec Fox', sci: 'Vulpes zerda', habitat: 'desert', cls: 'Mammal', diet: 'Omnivore',
      length: '24 – 41 cm (plus tail)', weight: '1 – 1.5 kg', lifespan: 'up to 10 years', speed: '≈ 40 km/h',
      status: 'LC', range: 'Sahara Desert, North Africa',
      blurb: 'The world\'s smallest fox, with the biggest ears for its size. It stays cool in its burrow by day and hunts at night.',
      facts: [
        'Its ears can be 15 cm long. They let out body heat and can hear insects moving under the sand.',
        'Furry soles on its feet protect it from scorching sand.',
        'It can go a long time without drinking, getting water from its food.',
        'Fennecs dig deep burrows with many tunnels, sometimes shared by families.',
      ],
      eats: ['beetle', 'jerboa'], eatenBy: ['goldenwolf'],
      quiz: { q: 'What are two jobs of a fennec fox\'s huge ears?', a: ['Flying and swimming', 'Losing heat and hearing prey', 'Storing fat and water'], correct: 1 },
      power: 'ears', role: 'hunt', targets: ['beetle', 'jerboa'], threats: ['goldenwolf'], speedStat: 1.1, sizeStat: 0.55, wary: 0.7, layer: 'ground', worldScale: 0.45,
      art: {
        kind: 'quad', len: 62, depth: 26, leg: 26, legW: 6, feet: 'pad', slope: 2, tuck: 3,
        neck: { len: 12, angle: 30, w: 18 },
        head: { len: 30, h: 21, snout: 0.5, snoutH: 0.35, stop: 0.12, ears: { type: 'big', size: 1.25, x: 0.24, tilt: -18 }, whiskers: true, eyeR: 2.8, markings: foxFace('#fbf3e2', '#b37a46') },
        tail: { len: 44, w: 7, type: 'bushy', droop: 70, tip: '#2a1c12' },
        colors: { base: '#e8c896', belly: '#fbf3e2', nose: '#1a120c', eye: '#2a1a0c', earInner: '#f2c9b0', socks: null },
      },
    },
    {
      id: 'camel', name: 'Dromedary Camel', sci: 'Camelus dromedarius', habitat: 'desert', cls: 'Mammal', diet: 'Herbivore',
      length: 'about 2 m tall at the hump', weight: '300 – 600 kg', lifespan: 'about 40 years', speed: '≈ 40 km/h for long distances',
      status: 'NE', statusNote: 'Domesticated (no longer found truly wild)', range: 'North Africa & the Middle East; wild-living herds in Australia',
      blurb: 'The one-humped "ship of the desert". Camels are built to survive heat, sand and long stretches without water.',
      facts: [
        'Its hump stores fat, not water! The fat is energy for when food is scarce.',
        'A thirsty camel can drink about 100 litres of water in around 10 minutes.',
        'Two rows of long eyelashes and closable nostrils keep blowing sand out.',
        'Wide, padded feet spread out so the camel doesn\'t sink into soft sand.',
      ],
      eats: ['dates', 'saltbush'], eatenBy: [],
      quiz: { q: 'What is stored in a camel\'s hump?', a: ['Water', 'Fat', 'Sand'], correct: 1 },
      power: 'endurance', role: 'survive', targets: ['dates', 'saltbush'], threats: ['dustdevil'], speedStat: 0.95, sizeStat: 1.35, wary: 0.2, layer: 'ground', worldScale: 1.2,
      art: {
        kind: 'quad', len: 110, depth: 54, leg: 100, legW: 11, feet: 'pad', footW: 16, slope: 4, tuck: 6, hump: 34,
        neck: { len: 72, angle: 26, w: 26, curve: 26 },
        head: { len: 46, h: 24, snout: 0.5, snoutH: 0.6, stop: 0.04, ears: { type: 'tiny', size: 1.2, x: 0.18 }, eyeR: 3.4, eyeX: 0.38, tilt: 22 },
        tail: { len: 45, w: 4, type: 'tuft', droop: 80 },
        colors: { base: '#c9a170', belly: '#dfc39a', nose: '#5a4030', eye: '#2a1a0c' },
      },
    },
    {
      id: 'viper', name: 'Saharan Horned Viper', sci: 'Cerastes cerastes', habitat: 'desert', cls: 'Reptile', diet: 'Carnivore',
      length: '30 – 60 cm', weight: 'about 0.3 kg', lifespan: 'up to 18 years', speed: 'sidewinds across loose sand',
      status: 'LC', range: 'Sahara Desert & Arabian Peninsula',
      blurb: 'A sand-coloured ambush hunter with spiky "horns" above its eyes. It buries itself until only its eyes peek out.',
      facts: [
        'The "horns" are actually raised scales, and some vipers don\'t have them at all.',
        'It moves by sidewinding, leaving J-shaped tracks in the sand.',
        'It can wiggle down into sand in seconds to hide from the sun and ambush prey.',
        'It is venomous — scientists study wild snakes only from a safe distance.',
      ],
      eats: ['jerboa'], eatenBy: ['falcon'],
      quiz: { q: 'What are a horned viper\'s "horns" made of?', a: ['Bone', 'Raised scales', 'Fur'], correct: 1 },
      power: 'ambush', role: 'hunt', targets: ['jerboa'], threats: ['falcon'], speedStat: 0.85, sizeStat: 0.65, wary: 0.4, layer: 'ground', worldScale: 0.7,
      art: {
        kind: 'snake', len: 130, w: 10, spots: true, horns: true, texture: 'scales', scaleSize: 2.4,
        colors: { body: '#d9b98a', base: '#d9b98a', belly: '#f0e2c4', spots: 'rgba(130,95,60,0.75)', eye: '#c69a45' },
      },
    },
    {
      id: 'jerboa', name: 'Lesser Egyptian Jerboa', sci: 'Jaculus jaculus', habitat: 'desert', cls: 'Mammal', diet: 'Herbivore (seeds & plants)',
      length: '10 cm (plus a 16 cm tail)', weight: '40 – 75 g', lifespan: 'about 6 years', speed: 'zig-zag hops up to ≈ 24 km/h',
      status: 'LC', range: 'Sahara Desert & the Middle East',
      blurb: 'A tiny desert hopper with kangaroo-like legs. It bounces across the sand at night in wild zig-zags.',
      facts: [
        'Its hind legs are much longer than its front legs, perfect for big jumps.',
        'A jerboa can leap a long way in one bound, changing direction to escape predators.',
        'It doesn\'t need to drink — it gets water from seeds and plants.',
        'By day it plugs its burrow entrance with sand to keep cool inside.',
      ],
      eats: ['seeds'], eatenBy: ['fennec', 'viper'],
      quiz: { q: 'How does a jerboa escape predators?', a: ['Zig-zag hopping', 'Climbing trees', 'Playing dead'], correct: 0 },
      power: 'leap', role: 'survive', targets: ['seeds'], threats: ['fennec', 'viper'], speedStat: 1.15, sizeStat: 0.35, wary: 0.8, layer: 'ground', worldScale: 0.45,
      art: {
        kind: 'rodent', size: 14, hopper: true, tailLen: 3.2, tailTuft: '#1a1a1a', earSize: 0.42,
        colors: { body: '#d8b07a', base: '#d8b07a', belly: '#fbf1dc', earInner: '#f0b7a8' },
      },
    },

    // ============================ ARCTIC ============================
    {
      id: 'polarbear', name: 'Polar Bear', sci: 'Ursus maritimus', habitat: 'arctic', cls: 'Mammal', diet: 'Carnivore',
      length: '1.8 – 2.5 m', weight: 'males 350 – 700 kg', lifespan: '15 – 18 years', speed: '≈ 40 km/h on land',
      status: 'VU', range: 'Arctic sea ice of Canada, Greenland, Alaska, Russia & Norway',
      blurb: 'The largest land carnivore. Polar bears hunt seals from the sea ice and are so at home in the water that they count as marine mammals.',
      facts: [
        'Under its white-looking fur, a polar bear\'s skin is black to soak up heat.',
        'Its fur hairs are actually see-through, not white.',
        'A polar bear can smell a seal nearly 1 km away.',
        'Melting sea ice makes hunting harder, which is why polar bears are vulnerable.',
      ],
      eats: ['harpseal'], eatenBy: [],
      quiz: { q: 'What colour is a polar bear\'s skin?', a: ['White', 'Pink', 'Black'], correct: 2 },
      power: 'sniff', role: 'hunt', targets: ['harpseal'], threats: [], speedStat: 0.95, sizeStat: 1.35, wary: 0.2, layer: 'ground', worldScale: 1.0,
      art: {
        kind: 'quad', len: 128, depth: 58, leg: 48, legW: 18, feet: 'pad', footW: 22, slope: -6, arch: 2, furLen: 4,
        neck: { len: 36, angle: 12, w: 40 },
        head: { len: 46, h: 30, snout: 0.45, snoutH: 0.55, stop: 0.03, ears: { type: 'tiny', size: 1.1, x: 0.2 }, eyeR: 2.6 },
        tail: { len: 12, w: 8, type: 'thin', droop: 70 },
        colors: { base: '#efe9da', belly: '#f6f1e6', nose: '#111', eye: '#1a120c' },
      },
    },
    {
      id: 'arcticfox', name: 'Arctic Fox', sci: 'Vulpes lagopus', habitat: 'arctic', cls: 'Mammal', diet: 'Omnivore',
      length: '46 – 68 cm (plus tail)', weight: '3 – 8 kg', lifespan: '3 – 6 years', speed: '≈ 45 km/h',
      status: 'LC', range: 'Arctic tundra all around the North Pole',
      blurb: 'A fluffy fox whose coat changes with the seasons: snowy white in winter, brown-grey in summer.',
      facts: [
        'Its thick winter coat lets it stay comfortable at around −50 °C.',
        'Its scientific name "lagopus" means "hare-footed" — its paws are furry underneath.',
        'It can hear lemmings moving under the snow, then pounces nose-first to catch them.',
        'Arctic foxes sometimes follow polar bears to eat leftover scraps.',
      ],
      eats: ['lemming'], eatenBy: ['polarbear'],
      quiz: { q: 'How does an arctic fox find lemmings under the snow?', a: ['By hearing them', 'By digging everywhere', 'By seeing through snow'], correct: 0 },
      power: 'camo', role: 'hunt', targets: ['lemming'], threats: ['polarbear'], speedStat: 1.1, sizeStat: 0.6, wary: 0.6, layer: 'ground', worldScale: 0.5,
      art: {
        kind: 'quad', len: 68, depth: 32, leg: 26, legW: 7, feet: 'pad', slope: 1, tuck: 2, furLen: 4.5,
        neck: { len: 14, angle: 28, w: 22 },
        head: { len: 30, h: 22, snout: 0.45, snoutH: 0.38, stop: 0.12, ears: { type: 'pointed', size: 0.7, x: 0.22 }, whiskers: false, eyeR: 2.6 },
        tail: { len: 50, w: 9, type: 'bushy', droop: 70 },
        colors: { base: '#f3f1ec', belly: '#ffffff', nose: '#151515', eye: '#4a3418', earInner: '#d8d2c8' },
      },
    },
    {
      id: 'snowyowl', name: 'Snowy Owl', sci: 'Bubo scandiacus', habitat: 'arctic', cls: 'Bird', diet: 'Carnivore',
      length: '52 – 71 cm', weight: '1.6 – 3 kg', lifespan: 'about 10 years', speed: 'powerful, silent flier',
      status: 'VU', range: 'Arctic tundra; some fly south in winter',
      blurb: 'A big white owl of the open tundra. Unlike most owls, it often hunts in daylight — during Arctic summer the sun never sets!',
      facts: [
        'One snowy owl may eat more than 1,600 lemmings in a year.',
        'Soft, fringed feathers let owls fly almost silently.',
        'Males get whiter with age; females keep more dark bars.',
        'Even its toes are covered in feathers, like fluffy slippers.',
      ],
      eats: ['lemming'], eatenBy: [],
      quiz: { q: 'Why can snowy owls hunt in daylight in summer?', a: ['They have night vision goggles', 'The Arctic summer sun never sets', 'Lemmings glow'], correct: 1 },
      power: 'silent', role: 'hunt', targets: ['lemming'], threats: [], speedStat: 1.1, sizeStat: 0.85, wary: 0.5, layer: 'tree', worldScale: 0.85, flyer: true,
      art: {
        kind: 'bird', size: 30, bodyW: 1.05, bodyH: 0.85, headR: 0.62, headW: 1.0, tailLen: 0.55, legLen: 9, stance: -70, upright: true, feathered: true,
        beak: 'hook', beakLen: 0.35, beakH: 0.35, eyeR: 0.17, eyeX: 0.42, facialDisk: true, wingSpan: 2.2,
        pattern: { type: 'barring', color: '#3a3530', size: 4, density: 0.45 },
        colors: { body: '#f4f2ec', base: '#f4f2ec', wing: '#ecebe4', head: '#f8f7f2', eye: '#f2c418', beak: '#2a2a2a', legs: '#f0eee8' },
      },
    },
    {
      id: 'harpseal', name: 'Harp Seal', sci: 'Pagophilus groenlandicus', habitat: 'arctic', cls: 'Mammal', diet: 'Carnivore',
      length: '1.7 – 1.9 m', weight: '120 – 135 kg', lifespan: '30+ years', speed: 'swift, graceful swimmer',
      status: 'LC', range: 'North Atlantic & Arctic Oceans',
      blurb: 'A silver seal with a dark "harp" shape on its back. Pups are born on the sea ice wrapped in fluffy white fur.',
      facts: [
        'Fluffy white pups are called "whitecoats" and lose that fur after a few weeks.',
        'Harp seals can dive deeper than 300 m to catch fish.',
        'A thick layer of blubber keeps them warm in icy water.',
        'Each year they travel thousands of kilometres between feeding and breeding areas.',
      ],
      eats: ['arcticcod'], eatenBy: ['polarbear', 'orca'],
      quiz: { q: 'What keeps a harp seal warm in icy water?', a: ['A thick layer of blubber', 'Hot springs', 'Swimming fast all day'], correct: 0 },
      power: 'blubber', role: 'survive', targets: ['arcticcod'], threats: ['orca'], speedStat: 1.05, sizeStat: 0.95, wary: 0.45, layer: 'water', worldScale: 0.9, swimmer: true,
      art: {
        kind: 'seal', len: 110, h: 40, saddle: '#2b2b30', spots: true,
        colors: { body: '#b7bcc2', base: '#b7bcc2', belly: '#e9ebee' },
      },
    },

    // ============================ NORTH WOODS ============================
    {
      id: 'wolf', name: 'Gray Wolf', sci: 'Canis lupus', habitat: 'forest', cls: 'Mammal', diet: 'Carnivore',
      length: '1 – 1.6 m (plus tail)', weight: '30 – 60 kg', lifespan: '6 – 8 years in the wild', speed: '≈ 60 km/h',
      status: 'LC', range: 'North America, Europe & Asia',
      blurb: 'A clever hunter that lives in family packs. Minnesota has the most wolves of any US state outside Alaska.',
      facts: [
        'A wolf pack is usually a family: parents and their pups of different ages.',
        'Wolves howl to find each other and warn other packs; howls carry for many kilometres.',
        'Wolves can travel more than 50 km in a single day.',
        'When wolves returned to Yellowstone in 1995, rivers and forests changed too. Scientists call this a trophic cascade.',
      ],
      eats: ['deer', 'hare'], eatenBy: [],
      quiz: { q: 'What is a wolf pack usually made of?', a: ['Strangers', 'A family', 'Only adult males'], correct: 1 },
      power: 'howl', role: 'hunt', targets: ['deer', 'hare'], threats: [], speedStat: 1.1, sizeStat: 1.0, wary: 0.6, layer: 'ground', worldScale: 0.72,
      art: {
        kind: 'quad', len: 104, depth: 40, leg: 50, legW: 10, feet: 'pad', slope: 6, tuck: 6, furLen: 4,
        neck: { len: 24, angle: 24, w: 32 },
        head: { len: 40, h: 26, snout: 0.5, snoutH: 0.4, stop: 0.12, ears: { type: 'pointed', size: 0.85, x: 0.22 }, eyeR: 2.7, markings: foxFace('#e8e2d6', null) },
        tail: { len: 56, w: 8, type: 'bushy', droop: 72, tip: '#1d1a17' },
        mane: { type: 'ruff', color: '#6e665e' },
        pattern: { type: 'blotches', color: '#3d3833', size: 10, alpha: 0.35 },
        colors: { base: '#8d847a', belly: '#e1d9cc', nose: '#111', eye: '#c79a35', earInner: '#5a524a' },
      },
    },
    {
      id: 'deer', name: 'White-tailed Deer', sci: 'Odocoileus virginianus', habitat: 'forest', cls: 'Mammal', diet: 'Herbivore',
      length: '1.5 – 2 m', weight: '45 – 135 kg', lifespan: '6 – 14 years', speed: '≈ 50 km/h',
      status: 'LC', range: 'Southern Canada to northern South America',
      blurb: 'A graceful browser of forest edges. When alarmed, it flashes the bright white underside of its tail.',
      facts: [
        'Raising the white tail like a flag warns other deer of danger.',
        'Only males (bucks) grow antlers, and they shed and regrow them every year.',
        'Fawns have white spots that look like sunlight dapples on the forest floor.',
        'A deer can leap over a 2.5 m fence and bound up to 9 m in one jump.',
      ],
      eats: ['acorn', 'leaves'], eatenBy: ['wolf'],
      quiz: { q: 'Why does a white-tailed deer raise its tail?', a: ['To warn others of danger', 'To swat flies only', 'To keep warm'], correct: 0 },
      power: 'zigzag', role: 'survive', targets: ['acorn'], threats: ['wolf'], speedStat: 1.2, sizeStat: 1.05, wary: 0.85, layer: 'ground', worldScale: 0.85,
      art: {
        kind: 'quad', len: 100, depth: 42, leg: 72, legW: 8, feet: 'hoof', slope: 4, tuck: 8,
        neck: { len: 44, angle: 50, w: 22 },
        head: { len: 36, h: 20, snout: 0.5, snoutH: 0.5, ears: { type: 'leaf', size: 1.2, x: 0.2 }, eyeR: 3.2, eyeX: 0.42, markings: whiteFaceMask('#f3eee4') },
        tail: { len: 18, w: 8, type: 'thin', droop: 30, lift: 50, tip: '#ffffff' },
        antlers: { size: 30, color: '#d9c7a1' },
        colors: { base: '#a07048', belly: '#f4ece0', nose: '#151010', eye: '#1a1008', hoof: '#2a1d14' },
      },
    },
    {
      id: 'baldeagle', name: 'Bald Eagle', sci: 'Haliaeetus leucocephalus', habitat: 'forest', cls: 'Bird', diet: 'Carnivore (mostly fish)',
      length: '70 – 100 cm', weight: '3 – 6.3 kg', lifespan: '20+ years', speed: 'dives faster than 100 km/h',
      status: 'LC', range: 'Lakes, rivers & coasts across North America',
      blurb: 'A huge fish-eating eagle and a famous comeback story. In December 2024 it officially became the national bird of the United States.',
      facts: [
        'It isn\'t bald! "Balde" is an old word meaning white, for its white head.',
        'Bald eagles build the biggest tree nests of any North American bird — one weighed about 2 tonnes!',
        'Its eyesight is several times sharper than a human\'s.',
        'After the pesticide DDT was banned in 1972, bald eagles recovered from near extinction.',
      ],
      eats: ['trout'], eatenBy: [],
      quiz: { q: 'Why is it called a "bald" eagle?', a: ['It has no feathers on its head', 'From an old word meaning white', 'It loses its feathers in winter'], correct: 1 },
      power: 'eagleeye', role: 'hunt', targets: ['trout'], threats: [], speedStat: 1.2, sizeStat: 1.1, wary: 0.4, layer: 'tree', worldScale: 1.0, flyer: true,
      art: {
        kind: 'bird', size: 34, bodyW: 1.35, bodyH: 0.6, headR: 0.42, headW: 1.15, tailLen: 0.9, legLen: 12, stance: -45, feathered: false,
        beak: 'hook', beakLen: 0.95, beakH: 0.6, eyeR: 0.14, eyeX: 0.4, brow: true, wingSpan: 2.6,
        colors: { body: '#3b2617', base: '#3b2617', wing: '#33210f', head: '#fbfaf5', tail: '#fbfaf5', eye: '#e8c33a', beak: '#efbb1d', legs: '#efbb1d' },
      },
    },
    {
      id: 'blackbear', name: 'American Black Bear', sci: 'Ursus americanus', habitat: 'forest', cls: 'Mammal', diet: 'Omnivore',
      length: '1.2 – 2 m', weight: '40 – 270 kg', lifespan: 'about 20 years', speed: '≈ 50 km/h',
      status: 'LC', range: 'Forests of Canada, the USA & northern Mexico',
      blurb: 'North America\'s most common bear. Despite the name, black bears can be brown, cinnamon, blond — even white!',
      facts: [
        'Most of a black bear\'s diet is plants: berries, nuts, roots and grasses.',
        'They are excellent tree climbers, even as adults.',
        'In winter they can den for up to 7 months without eating, drinking or going to the toilet.',
        'The rare white "spirit bear" of British Columbia is a black bear.',
      ],
      eats: ['berries', 'acorn'], eatenBy: ['wolf'],
      quiz: { q: 'What makes up most of a black bear\'s diet?', a: ['Fish', 'Plants like berries and nuts', 'Deer'], correct: 1 },
      power: 'hibernate', role: 'survive', targets: ['berries', 'acorn'], threats: ['wolf'], speedStat: 0.95, sizeStat: 1.2, wary: 0.4, layer: 'ground', worldScale: 0.85,
      art: {
        kind: 'quad', len: 110, depth: 56, leg: 42, legW: 17, feet: 'pad', footW: 20, slope: 6, arch: 6, furLen: 3.8,
        neck: { len: 18, angle: 18, w: 42 },
        head: { len: 40, h: 32, snout: 0.42, snoutH: 0.48, stop: 0.08, ears: { type: 'round', size: 0.85, x: 0.25 }, eyeR: 2.5 },
        tail: { len: 10, w: 7, type: 'thin', droop: 70 },
        colors: { base: '#1e1a18', belly: '#2a2420', nose: '#0a0808', eye: '#3a2412', muzzle: '#9a7350', earInner: '#2a2420' },
      },
    },
  ];

  // Non-WildDex creatures & food used in exploration scenery and minigames.
  const EXTRAS = {
    gazelle: { name: "Thomson's Gazelle", sci: 'Eudorcas thomsonii', speedStat: 1.2, art: {
      kind: 'quad', len: 70, depth: 30, leg: 52, legW: 6, feet: 'hoof', slope: 4, tuck: 6,
      neck: { len: 28, angle: 48, w: 15 },
      head: { len: 26, h: 14, snout: 0.5, snoutH: 0.5, ears: { type: 'leaf', size: 1.1, x: 0.22 }, eyeR: 2.4, eyeX: 0.42 },
      tail: { len: 12, w: 4, type: 'thin', droop: 60, tip: '#111' }, horns: { len: 22, w: 3.4, color: '#3b3128' },
      colors: { base: '#c88d52', belly: '#fbf5ea', nose: '#111', eye: '#1a1008', hoof: '#2a1d14' },
      pattern: { type: 'none' }, stripeSide: true } },
    zebra: { name: 'Plains Zebra', sci: 'Equus quagga', speedStat: 1.05, art: {
      kind: 'quad', len: 108, depth: 50, leg: 62, legW: 10, feet: 'hoof', slope: 2, tuck: 2,
      neck: { len: 40, angle: 38, w: 30 },
      head: { len: 46, h: 24, snout: 0.55, snoutH: 0.6, stop: 0.02, ears: { type: 'leaf', size: 1.0, x: 0.2 }, eyeR: 3, eyeX: 0.38 },
      tail: { len: 50, w: 4, type: 'tuft', droop: 78, tip: '#111' }, mane: { type: 'upright', color: '#111', alt: '#f4f1ea', size: 6 },
      pattern: { type: 'stripes', color: '#151515', size: 6, bend: true },
      colors: { base: '#f4f1ea', nose: '#151515', eye: '#1a1008', muzzle: '#2a2724', hoof: '#151515' } } },
    hyena: { name: 'Spotted Hyena', sci: 'Crocuta crocuta', speedStat: 1.0, art: {
      kind: 'quad', len: 92, depth: 44, leg: 52, legW: 11, feet: 'pad', slope: 18, tuck: 4,
      neck: { len: 26, angle: 22, w: 34 },
      head: { len: 40, h: 30, snout: 0.4, snoutH: 0.55, ears: { type: 'round', size: 0.95, x: 0.22 }, eyeR: 2.6 },
      tail: { len: 30, w: 6, type: 'tuft', droop: 70, tip: '#2a2018' },
      pattern: { type: 'spots', color: '#3b2a1c', size: 4 },
      colors: { base: '#b39a72', belly: '#c9b48e', nose: '#111', eye: '#3a2412', muzzle: '#3b2e22', earInner: '#3b2e22' } } },
    capybara: { name: 'Capybara', sci: 'Hydrochoerus hydrochaeris', speedStat: 0.9, art: {
      kind: 'quad', len: 80, depth: 46, leg: 22, legW: 9, feet: 'pad', slope: -4, arch: 6,
      neck: { len: 10, angle: 10, w: 34 },
      head: { len: 38, h: 28, snout: 0.6, snoutH: 0.85, stop: 0.0, ears: { type: 'tiny', size: 1.0, x: 0.2 }, eyeR: 2.4, eyeX: 0.42, eyeY: 0.28 },
      tail: null,
      colors: { base: '#8a5f3a', belly: '#a77b52', nose: '#2a1a12', eye: '#1a1008' } } },
    goldenwolf: { name: 'African Golden Wolf', sci: 'Canis lupaster', speedStat: 1.0, art: {
      kind: 'quad', len: 80, depth: 32, leg: 44, legW: 8, feet: 'pad', slope: 4, tuck: 5,
      neck: { len: 20, angle: 26, w: 24 },
      head: { len: 34, h: 22, snout: 0.5, snoutH: 0.4, stop: 0.12, ears: { type: 'pointed', size: 0.95, x: 0.22 }, eyeR: 2.4, markings: foxFace('#eee2c8', null) },
      tail: { len: 40, w: 7, type: 'bushy', droop: 72, tip: '#2a2018' },
      colors: { base: '#c2a06c', belly: '#ecdcbc', nose: '#111', eye: '#b8862a', earInner: '#8a6a44' } } },
    hare: { name: 'Snowshoe Hare', sci: 'Lepus americanus', speedStat: 1.15, art: {
      kind: 'rodent', size: 18, hopper: true, tailLen: 0.3, earSize: 0.55,
      colors: { body: '#8a6a4a', base: '#8a6a4a', belly: '#e8dccb', earInner: '#c9a090' } } },
    lemming: { name: 'Brown Lemming', sci: 'Lemmus trimucronatus', speedStat: 0.9, art: {
      kind: 'rodent', size: 11, tailLen: 0.25, earSize: 0.12,
      colors: { body: '#8a6440', base: '#8a6440', belly: '#c9a77a', stripe: null } } },
    harpy: { name: 'Harpy Eagle', sci: 'Harpia harpyja', speedStat: 1.0, flyer: true, art: {
      kind: 'bird', size: 36, bodyW: 1.3, bodyH: 0.7, headR: 0.46, tailLen: 0.9, legLen: 14, stance: -50, beak: 'hook', beakLen: 0.7, beakH: 0.6, crest: true, wingSpan: 2.4,
      colors: { body: '#5a5f66', base: '#5a5f66', wing: '#2e3136', head: '#9aa0a6', breast: '#f0eee8', crest: '#3a3d42', beak: '#2a2a2a', legs: '#e3b52a', eye: '#3a2614' } } },
    falcon: { name: 'Lanner Falcon', sci: 'Falco biarmicus', speedStat: 1.1, flyer: true, art: {
      kind: 'bird', size: 26, bodyW: 1.2, bodyH: 0.6, headR: 0.42, tailLen: 0.9, legLen: 10, stance: -45, beak: 'hook', beakLen: 0.5, beakH: 0.45, wingSpan: 2.4,
      pattern: { type: 'speckle', color: '#5a3a24', size: 2.5 },
      colors: { body: '#a2836a', base: '#a2836a', wing: '#6b5546', head: '#c46a3a', breast: '#f2e6d4', beak: '#3a3a3a', legs: '#e8c13a', eye: '#2a1a0a' } } },
    snake: { name: 'Fire-bellied Snake', sci: 'Erythrolamprus epinephelus', speedStat: 0.9, art: {
      kind: 'snake', len: 120, w: 7, bands: true, texture: 'scales', scaleSize: 2,
      colors: { body: '#3d6b3a', base: '#3d6b3a', belly: '#d9452a', spots: '#141414', eye: '#c9a032' } } },
    moray: { name: 'Giant Moray', sci: 'Gymnothorax javanicus', speedStat: 0.95, art: {
      kind: 'snake', len: 200, w: 14, spots: true, texture: 'smooth',
      colors: { body: '#6b6a3a', base: '#6b6a3a', belly: '#8a8a4a', spots: '#2a2a18', eye: '#e8d27a' } } },
    tigershark: { name: 'Tiger Shark', sci: 'Galeocerdo cuvier', speedStat: 1.05, art: {
      kind: 'fish', len: 230, h: 48, shark: true, shape: 0.6, eyeR: 0.06, eyeX: 0.4, belly: 0.85,
      colors: { body: '#7a8590', back: '#56606a', belly: '#e9ecef', fins: '#6a7580', eye: '#111', stripe: null } } },
    reefshark: { name: 'Blacktip Reef Shark', sci: 'Carcharhinus melanopterus', speedStat: 1.05, art: {
      kind: 'fish', len: 170, h: 34, shark: true, shape: 0.6, eyeR: 0.07, eyeX: 0.4, belly: 0.85,
      colors: { body: '#a3a89a', back: '#8a8f82', belly: '#f2f2ec', fins: '#8a8f82', eye: '#111' } } },
    grouper: { name: 'Coral Grouper', sci: 'Cephalopholis miniata', speedStat: 0.95, art: {
      kind: 'fish', len: 110, h: 44, shape: 0.75, tailW: 0.5, dorsalH: 0.25, dorsalStart: 0.25, dorsalEnd: -0.4, eyeR: 0.09, spotsColor: '#7ad3f0',
      colors: { body: '#d8322a', fins: '#c22a22', eye: '#1a1a1a' } } },
    orca: { name: 'Orca', sci: 'Orcinus orca', speedStat: 1.1, art: {
      kind: 'cetacean', len: 260, h: 70, orca: true, dorsalX: 0.0, dorsalH: 1.0,
      colors: { body: '#121417', base: '#121417', belly: '#f4f6f8' } } },
    reeffish: { name: 'Blue-and-yellow Fusilier', sci: 'Caesio teres', speedStat: 1.0, art: {
      kind: 'fish', len: 50, h: 18, shape: 0.8, tailW: 0.6, forked: true, dorsalH: 0.25, eyeR: 0.13,
      colors: { body: '#2f6fd6', back: '#2f6fd6', belly: '#f2d43a', fins: '#f2d43a', eye: '#111' } } },
    arcticcod: { name: 'Arctic Cod', sci: 'Boreogadus saida', speedStat: 0.95, art: {
      kind: 'fish', len: 48, h: 14, shape: 0.8, tailW: 0.5, dorsalH: 0.25, eyeR: 0.15,
      colors: { body: '#9aa3a8', back: '#5f6a72', belly: '#e8ecef', fins: '#7a858c', eye: '#111' } } },
    trout: { name: 'Lake Trout', sci: 'Salvelinus namaycush', speedStat: 0.95, art: {
      kind: 'fish', len: 70, h: 18, shape: 0.8, tailW: 0.55, forked: true, dorsalH: 0.28, eyeR: 0.12, spotsColor: 'rgba(240,240,220,0.7)',
      colors: { body: '#5f7468', back: '#3e4f45', belly: '#e8e2d0', fins: '#7a6a52', eye: '#111' } } },
    crab: { name: 'Red Reef Crab', sci: 'Carpilius maculatus', art: { kind: 'bug', kind2: 'crab', size: 16, colors: { body: '#c8442a' } } },
    ant: { name: 'Leafcutter Ant', sci: 'Atta cephalotes', art: { kind: 'bug', size: 9, colors: { body: '#7a3a1a' } } },
    beetle: { name: 'Darkling Beetle', sci: 'Tenebrionidae', art: { kind: 'bug', size: 10, colors: { body: '#1c1a18' } } },
    scorpion: { name: 'Deathstalker Scorpion', sci: 'Leiurus quinquestriatus', art: { kind: 'bug', size: 14, colors: { body: '#d6b45a' } } },
    // Food (art kind 'food')
    acacia: { name: 'Acacia leaves', food: true, art: { kind: 'food', kind2: 'leaves', size: 22, color: '#7d9a3a', thorns: true } },
    grass: { name: 'Fresh grass', food: true, art: { kind: 'food', kind2: 'grass', size: 18, color: '#9aa63a', color2: '#d9cf7a' } },
    fruit: { name: 'Jungle fruit', food: true, art: { kind: 'food', kind2: 'fruit', size: 14, color: '#d9581a', color2: '#ffd27a' } },
    plankton: { name: 'Plankton', food: true, art: { kind: 'food', kind2: 'plankton', size: 14 } },
    seagrass: { name: 'Seagrass', food: true, art: { kind: 'food', kind2: 'seagrass', size: 20, color: '#4f8a3a', color2: '#9ad06a' } },
    seeds: { name: 'Desert seeds', food: true, art: { kind: 'food', kind2: 'seeds', size: 12 } },
    dates: { name: 'Dates', food: true, art: { kind: 'food', kind2: 'dates', size: 16 } },
    saltbush: { name: 'Desert shrub', food: true, art: { kind: 'food', kind2: 'leaves', size: 18, color: '#8a9a6a' } },
    acorn: { name: 'Acorns', food: true, art: { kind: 'food', kind2: 'acorn', size: 12 } },
    berries: { name: 'Blueberries', food: true, art: { kind: 'food', kind2: 'berries', size: 16, color: '#2a2a6a', color2: '#7a8af0' } },
    leaves: { name: 'Leaves', food: true, art: { kind: 'food', kind2: 'leaves', size: 18, color: '#b8702a' } },
    dustdevil: { name: 'Dust devil', hazard: true },
  };

  // Normalise: give every art spec an id; map bug/food sub-kinds.
  const fillBase = art => { if (art.colors) art.colors.base = art.colors.base || art.colors.body || '#888888'; };
  for (const a of A) { a.art.id = a.id; a.art.pattern = a.art.pattern || null; fillBase(a.art); }
  for (const k in EXTRAS) {
    const e = EXTRAS[k];
    e.id = k;
    if (!e.art) continue;
    e.art.id = k;
    fillBase(e.art);
    if (e.art.kind === 'bug') { e.art.kind = 'bug'; e.art.kind = 'bug'; e.art.bugKind = e.art.kind2 || (k === 'scorpion' ? 'scorpion' : k === 'ant' ? 'ant' : 'beetle'); }
    if (e.art.kind === 'food') e.art.foodKind = e.art.kind2;
    if (e.art.pattern && e.art.pattern.type === 'none') e.art.pattern = null;
  }
  A.forEach((a, i) => { a.num = i + 1; });

  WE.ANIMALS = A;
  WE.EXTRAS = EXTRAS;
  WE.animalById = id => A.find(a => a.id === id) || null;
  // Any creature/food by id (dex animals first).
  WE.creature = id => WE.animalById(id) || EXTRAS[id] || null;

  WE.STATUS = {
    LC: { label: 'Least Concern', color: '#3a9a5a' },
    NT: { label: 'Near Threatened', color: '#8ab33a' },
    VU: { label: 'Vulnerable', color: '#e0a92a' },
    EN: { label: 'Endangered', color: '#e0662a' },
    CR: { label: 'Critically Endangered', color: '#c8302a' },
    NE: { label: 'Not Evaluated', color: '#8a8f96' },
  };
})(window.WE);
