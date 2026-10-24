// Dig sites, rock styles, bonus finds, field tips. Creature facts come from the WildDex
// prehistoric data (WE.ANIMALS); the ammonite is described here.
window.FD = window.FD || {};
(function (FD, WE) {
  // Rock and bone colours for each kind of fossil bed.
  const ROCK = {
    hellcreek:  { name: 'Grey-tan sandstone', matrix: '#a69a86', rock: '#8c8272', dirt: '#7a6a56', dust: '#bfb29c', bone: '#5a3e2a', edge: '#2a1c12', impression: '#6a5a48', note: 'Hell Creek bones are dark chocolate brown: minerals from the groundwater stained them as they fossilised.' },
    morrison:   { name: 'Mudstone and sandstone', matrix: '#b49a80', rock: '#9a8070', dirt: '#8a6e5a', dust: '#cdb59c', bone: '#6e4c3c', edge: '#2e1c14', impression: '#7a6050', note: 'The Morrison Formation formed on wide river plains. Floods buried bones in sand and mud.' },
    gobi:       { name: 'Red Djadokhta sandstone', matrix: '#d08a56', rock: '#b06a3c', dirt: '#c27a48', dust: '#e0a878', bone: '#f2e8d8', edge: '#7a4a2a', impression: '#b07a50', note: 'Gobi fossils are often bright white in orange sand. Many animals were buried alive by collapsing sand dunes.' },
    yixian:     { name: 'Grey lake shale', matrix: '#9c978c', rock: '#7e7a72', dirt: '#86827a', dust: '#b8b4aa', bone: '#4e3626', edge: '#1e140c', impression: '#5e5044', note: 'Volcanic ash settled gently into an ancient lake here, preserving even feathers and fluff.' },
    kemkem:     { name: 'Red river sandstone', matrix: '#c48a5c', rock: '#a46a42', dirt: '#b47a50', dust: '#dca47a', bone: '#7a4a30', edge: '#30180c', impression: '#8a5a3a', note: 'The Kem Kem beds were giant rivers. Fossils here are often single bones washed along by the current.' },
    chalk:      { name: 'Niobrara Chalk', matrix: '#ddd6c2', rock: '#c8c0aa', dirt: '#b7aa8c', dust: '#ece6d6', bone: '#b78452', edge: '#5a3a1a', impression: '#a89878', note: 'Chalk is made from the shells of trillions of tiny sea plankton that sank to the sea floor.' },
    shale:      { name: 'Dark marine shale', matrix: '#5e5a54', rock: '#4a4742', dirt: '#6a645a', dust: '#8a847a', bone: '#c4a070', edge: '#2a2016', impression: '#7a7060', note: 'Dark shale formed from mud on a quiet sea floor with little oxygen, so nothing disturbed the shells.' },
    solnhofen:  { name: 'Solnhofen limestone', matrix: '#e4d4ac', rock: '#d0be92', dirt: '#bfa87e', dust: '#f0e4c4', bone: '#8a5634', edge: '#3a1e0e', impression: '#a88a66', note: 'This fine limestone splits into flat slabs. The lagoon water was too salty for scavengers, so skeletons stayed whole.' },
    ischigualasto: { name: 'Grey-green mudstone', matrix: '#8e978a', rock: '#727a6e', dirt: '#7a8070', dust: '#aab2a2', bone: '#8a5a44', edge: '#2e1a10', impression: '#6a6458', note: 'The Valley of the Moon has some of the oldest dinosaur fossils on Earth, from the Late Triassic.' },
  };

  // Ammonites are not in the WildDex creature list, so their entry lives here.
  const AMMONITE = {
    id: 'ammonite', name: 'Ammonite', sci: 'Placenticeras meeki', cls: 'Ammonite (a shelled relative of squid and octopus)', diet: 'Carnivore (probably plankton and small animals)',
    length: 'shell up to about 60 cm across', weight: 'a few kilograms (estimate)', lived: 'about 75 million years ago',
    blurb: 'Ammonites were sea animals with tentacles and a coiled, chambered shell. They lived for over 300 million years and died out with the dinosaurs.',
    facts: [
      'The wavy lines on an ammonite shell are suture lines, where the walls between its chambers joined the outer shell.',
      'An ammonite could change how much gas and water were in its chambers to float up or sink, like a submarine.',
      'Some Placenticeras shells have bite marks that may have come from mosasaurs.',
      'In Alberta, some ammonite shells turned into a shimmering rainbow gemstone called ammolite.',
    ],
    status: 'EX', art: { kind: 'ammonite', size: 40, colors: { shell: '#c8a878', body: '#c97a5a', bands: '#8a5a3a', base: '#c8a878' } },
  };
  FD.creature = id => (id === 'ammonite' ? AMMONITE : WE.ANIMALS.find(a => a.id === id));

  // Real localities. Each dig unlocks the next.
  FD.DIGS = [
    { id: 'ammonite', site: 'Bearpaw Shale', region: 'Alberta, Canada', mya: 75, period: 'Late Cretaceous', rock: 'shale', lat: 49.7, lon: -112.8, bonus: ['sharktooth', 'fishfossil'],
      clue: 'Something round and coiled, from an ancient sea floor.', decoys: ['Giant sea snail', 'Trilobite'], tutorial: true },
    { id: 'psittacosaurus', site: 'Lujiatun beds, Yixian Formation', region: 'Liaoning, China', mya: 125, period: 'Early Cretaceous', rock: 'yixian', lat: 41.6, lon: 120.4, bonus: ['fishfossil', 'leaf'],
      clue: 'A small plant-eater with a beak-like snout.', decoys: ['protoceratops', 'compsognathus'] },
    { id: 'protoceratops', site: 'Flaming Cliffs (Bayanzag)', region: 'Gobi Desert, Mongolia', mya: 75, period: 'Late Cretaceous', rock: 'gobi', lat: 44.1, lon: 103.7, bonus: ['eggshell', 'eggshell'],
      clue: 'A sheep-sized animal with a bony frill.', decoys: ['triceratops', 'psittacosaurus'] },
    { id: 'archaeopteryx', site: 'Solnhofen quarries', region: 'Bavaria, Germany', mya: 150, period: 'Late Jurassic', rock: 'solnhofen', lat: 48.9, lon: 11.0, bonus: ['dragonfly', 'fishfossil'],
      clue: 'A crow-sized skeleton. Look closely at the rock around it.', decoys: ['compsognathus', 'confuciusornis'] },
    { id: 'velociraptor', site: 'Tugrikin Shireh', region: 'Gobi Desert, Mongolia', mya: 75, period: 'Late Cretaceous', rock: 'gobi', lat: 44.0, lon: 103.3, bonus: ['eggshell', 'croctooth'],
      clue: 'A turkey-sized hunter with a special claw on each foot.', decoys: ['dakotaraptor', 'shuvuuia'] },
    { id: 'herrerasaurus', site: 'Valley of the Moon', region: 'Ischigualasto, Argentina', mya: 231, period: 'Late Triassic', rock: 'ischigualasto', lat: -30.2, lon: -67.8, bonus: ['wood', 'croctooth'],
      clue: 'One of the earliest meat-eating dinosaurs.', decoys: ['eoraptor', 'saurosuchus'] },
    { id: 'stegosaurus', site: 'Garden Park', region: 'Colorado, USA', mya: 150, period: 'Late Jurassic', rock: 'morrison', lat: 38.5, lon: -105.2, bonus: ['wood', 'croctooth'],
      clue: 'A big plant-eater with plates and spikes.', decoys: ['ankylosaurus', 'brachiosaurus'] },
    { id: 'pteranodon', site: 'Smoky Hill Chalk', region: 'Kansas, USA', mya: 85, period: 'Late Cretaceous', rock: 'chalk', lat: 38.9, lon: -100.5, bonus: ['sharktooth', 'fishfossil'],
      clue: 'Thin, hollow bones and very long arms, found in sea chalk.', decoys: ['alanqa', 'rhamphorhynchus'] },
    { id: 'allosaurus', site: 'Cleveland-Lloyd Quarry', region: 'Utah, USA', mya: 150, period: 'Late Jurassic', rock: 'morrison', lat: 39.3, lon: -110.7, bonus: ['croctooth', 'coprolite'],
      clue: 'A large hunter with three-fingered hands.', decoys: ['ceratosaurus', 'trex'] },
    { id: 'triceratops', site: 'Hell Creek badlands', region: 'Montana, USA', mya: 66, period: 'Late Cretaceous', rock: 'hellcreek', lat: 47.6, lon: -106.6, bonus: ['croctooth', 'leaf'],
      clue: 'A huge skull with a frill and horns.', decoys: ['protoceratops', 'pachycephalosaurus'] },
    { id: 'elasmosaurus', site: 'Pierre Shale', region: 'Kansas, USA', mya: 80, period: 'Late Cretaceous', rock: 'chalk', lat: 38.8, lon: -101.0, bonus: ['sharktooth', 'fishfossil'],
      clue: 'A sea reptile with a very, very long neck.', decoys: ['tylosaurus', 'archelon'] },
    { id: 'edmontosaurus', site: 'Hell Creek badlands', region: 'Montana, USA', mya: 66, period: 'Late Cretaceous', rock: 'hellcreek', lat: 47.4, lon: -106.2, bonus: ['leaf', 'coprolite'],
      clue: 'A large plant-eater with a broad, flat snout.', decoys: ['triceratops', 'psittacosaurus'] },
    { id: 'spinosaurus', site: 'Kem Kem Beds', region: 'Morocco', mya: 95, period: 'mid-Cretaceous', rock: 'kemkem', lat: 30.9, lon: -4.0, bonus: ['sharktooth', 'croctooth'],
      clue: 'A river giant with tall spines along its back.', decoys: ['carcharodontosaurus', 'deltadromeus'] },
    { id: 'tylosaurus', site: 'Smoky Hill Chalk', region: 'Kansas, USA', mya: 85, period: 'Late Cretaceous', rock: 'chalk', lat: 39.1, lon: -100.9, bonus: ['sharktooth', 'fishfossil'],
      clue: 'A long sea reptile with paddles and a powerful tail.', decoys: ['elasmosaurus', 'xiphactinus'] },
    { id: 'diplodocus', site: 'Carnegie Quarry', region: 'Utah, USA', mya: 150, period: 'Late Jurassic', rock: 'morrison', lat: 40.44, lon: -109.3, bonus: ['wood', 'coprolite'],
      clue: 'An enormous plant-eater with a whip-like tail.', decoys: ['brachiosaurus', 'stegosaurus'] },
    { id: 'trex', site: 'Hell Creek badlands', region: 'Montana, USA', mya: 67, period: 'Late Cretaceous', rock: 'hellcreek', lat: 47.7, lon: -106.9, bonus: ['croctooth', 'coprolite'],
      clue: 'The giant of Hell Creek. Big skull, tiny arms.', decoys: ['allosaurus', 'yutyrannus'], finale: true },
  ];
  FD.rockFor = dig => ROCK[dig.rock];
  FD.decoyName = d => { const a = WE.ANIMALS.find(x => x.id === d); return a ? a.name : d; };

  // Field tips shown while digging.
  FD.TIPS = [
    'Paleontologists draw a grid over the quarry so they can record exactly where every bone was found.',
    'Use the rock pick on hard rock, the trowel on loose dirt, and the brush close to the bone.',
    'Fossil bone is often more fragile than the rock around it. Go gently when you get close.',
    'Fragile bones are wrapped in a plaster jacket, a bit like a cast on a broken arm, before they are moved.',
    'Bones that are still joined together in their natural positions are called "articulated".',
    'A fossil forms when minerals slowly fill or replace the bone after it is buried.',
    'Most animals never become fossils. They need to be buried quickly, before scavengers and weather destroy them.',
    'Bone chips on the surface are clues. They have weathered out of a skeleton further down.',
    'Field crews take photos and notes before removing any bone. Where it lay is part of the science.',
    'Scientists brush on a special glue called consolidant to harden crumbly fossil bone.',
  ];
  FD.LAB_TIPS = [
    'In the lab, preparators remove the rock from each bone, often with tiny air-powered tools.',
    'Missing bones are cast in plaster, resin or 3D-printed, often copied from other skeletons of the same kind.',
    'A museum mount uses a steel frame called an armature to hold the bones in a lifelike pose.',
    'Many museum skeletons on display are casts. The real bones are kept safe in collections for research.',
  ];

  // Parse a WildDex length like "about 12 m" or "about 50 cm" into metres.
  FD.lengthMetres = function (a) {
    const s = (a.length || '').replace(',', '.');
    const m = s.match(/([\d.]+)\s*(?:–|-|to)?\s*([\d.]+)?\s*(cm|m)\b/);
    if (!m) return null;
    const v = m[2] ? (parseFloat(m[1]) + parseFloat(m[2])) / 2 : parseFloat(m[1]);
    return m[3] === 'cm' ? v / 100 : v;
  };
})(window.FD, window.WE);
