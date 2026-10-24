# WildDex Explorer

An educational wildlife exploration game for the browser. You play a field explorer travelling to six real habitats around the world, **or time-travelling to eight real fossil sites** to meet dinosaurs and other prehistoric creatures. You photograph animals to fill your **WildDex**, a digital field journal (like a Pokédex) with a *Today* book and a *Prehistoric* book. Each discovery unlocks a **creature power**, and then you can play as that animal in hunt and survival minigames.

All art is drawn in code: shaded animal sprites with fur, scale and feather texture, coat patterns, walk cycles and painted parallax scenery. There are no emoji and no image files.

## How to play

Open `index.html` in any modern browser (double-clicking it works, no server needed). Progress saves in your browser.

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move / swim | Arrow keys or WASD | On-screen stick |
| Sneak (quiet, slow) | Hold Shift | SNEAK button |
| Run / sprint | Hold Space | RUN / SPRINT button |
| Observe an animal | E or Enter | Observe button |
| WildDex / Map | J / M | Top-right buttons |
| Creature powers (minigames) | 1, 2, 3 (or Q, R, F) | Power buttons |

1. **Explore.** Walk or swim through the habitat. Undiscovered animals have a **?** bubble, and edge arrows point to ones off screen. Running near an animal startles it, so sneak up quietly.
2. **Observe.** The field camera opens. Keep the focus circle on the moving animal until the bar fills to take a photo. Your photo is saved in the WildDex entry.
3. **Learn.** Each entry has the scientific name, size, weight, lifespan, top speed, range, IUCN conservation status, fun facts, a food chain and a quiz.
4. **Travel.** Open the World Map in the WildDex and tap a habitat to fly there. Discover 2 animals in a habitat to unlock the next one.
5. **Play as the animal.** Open *Challenges* (paw button) or an entry's play button:
   - **Hunt** (predators): sneak through cover, sprint when close, and catch prey before time runs out. Prey get tired after a long run.
   - **Survive** (prey): collect food while avoiding predators. A red **!** means you've been spotted.
   - Take your animal's own power plus 2 others you've unlocked.

## Habitats and animals

| Habitat (real place) | Animals |
| --- | --- |
| Serengeti Savanna, Tanzania | African Lion, Cheetah, African Bush Elephant, Masai Giraffe |
| Amazon Rainforest, South America | Jaguar, Toco Toucan, Dyeing Poison Dart Frog, Green Anaconda |
| Great Barrier Reef, Australia | Orange Clownfish, Green Sea Turtle, Day Octopus, Indo-Pacific Bottlenose Dolphin |
| Sahara Desert, North Africa | Fennec Fox, Dromedary Camel, Saharan Horned Viper, Lesser Egyptian Jerboa |
| Arctic Tundra & Sea Ice, Canada/Greenland | Polar Bear, Arctic Fox, Snowy Owl, Harp Seal |
| North Woods, Minnesota/Ontario | Gray Wolf, White-tailed Deer, Bald Eagle, American Black Bear |

Each of the 24 animals unlocks one of 24 creature powers based on its real biology. Examples: Cheetah Sprint, Mighty Roar, Echolocation, Ink Cloud, Winter Camouflage, Toxic Skin, Pack Howl, Sand Ambush and Eagle Eye.

## Prehistoric expedition

Choose **Travel back in time** on the title screen, or use the Time portal on the WildDex map. A time tunnel counts down the millions of years. The **Time Map** shows each era on a timeline (Triassic, Jurassic, Cretaceous) and where its fossils are found today. Scenery uses plants from each era: ferns, horsetails, cycads, ginkgos, tree ferns, monkey-puzzle conifers, seed ferns, and, in the Cretaceous, palms and early flowering plants. There is no grass, fruit trees or berry bushes, because those came later.

| Era (real fossil site) | When | Creatures |
| --- | --- | --- |
| Valley of the Moon, Ischigualasto, Argentina | 231 million years ago (Late Triassic) | Herrerasaurus, Eoraptor, Saurosuchus, Hyperodapedon, Ischigualastia |
| Morrison Formation, Colorado/Utah/Wyoming | 150 mya (Late Jurassic) | Allosaurus, Stegosaurus, Brachiosaurus, Diplodocus, Ceratosaurus |
| Solnhofen Lagoon, Bavaria, Germany | 150 mya (Late Jurassic) | Archaeopteryx, Compsognathus, Rhamphorhynchus, Pterodactylus |
| Yixian Formation, Liaoning, China | 125 mya (Early Cretaceous) | Yutyrannus, Microraptor, Psittacosaurus, Sinosauropteryx, Confuciusornis |
| Kem Kem Beds, Morocco | 95 mya (mid-Cretaceous) | Spinosaurus, Carcharodontosaurus, Deltadromeus, Onchopristis, Alanqa |
| Western Interior Seaway, Kansas | 85 mya (Late Cretaceous) | Tylosaurus, Elasmosaurus, Pteranodon, Xiphactinus, Archelon |
| Flaming Cliffs, Gobi Desert, Mongolia | 75 mya (Late Cretaceous) | Velociraptor, Protoceratops, Citipati, Pinacosaurus, Shuvuuia |
| Hell Creek, Montana | 66 mya (Late Cretaceous) | Tyrannosaurus rex, Triceratops, Edmontosaurus, Ankylosaurus, Pachycephalosaurus, Dakotaraptor |

That's 40 prehistoric creatures, each with facts, a quiz and its own creature power. Hell Creek is open from the start, and each era unlocks the next after 2 discoveries. Entries say clearly which creatures are not dinosaurs (pterosaurs, marine reptiles, early mammal relatives and so on). Most size and speed figures for extinct animals are estimates.

## Project layout

```
index.html            page shell
sprite-gallery.html   dev page showing every sprite (add #walk to see motion frames)
css/style.css         UI styling (handheld field-device look)
js/util.js            math, seeded random, colour and canvas helpers
js/data/animals.js    species facts, quizzes, powers and sprite specs
js/data/habitats.js   habitats and creature-power definitions
js/data/prehistoric.js eras, prehistoric creatures, powers and minigame stats
js/art/dinos.js       dinosaur, pterosaur, marine-reptile and ammonite renderers, prehistoric plants
js/art/prehistoric-scenes.js  era scenery (parallax and top-down arena looks)
js/art/sprites.js     procedural sprite engine (quadrupeds, birds, fish, cetaceans, seals, snakes, frog, turtle, octopus, critters, food, explorer)
js/art/backgrounds.js parallax habitat scenery and top-down arena ground
js/art/worldmap.js    world map (lon/lat outlines, equirectangular projection)
js/art/icons.js       vector icons for powers and UI
js/game/*.js          state/save, audio (Web Audio synth), input, explore, observe (camera), arena (minigames), journal (WildDex), ui
js/main.js            game loop and mode switching (title, explore, observe, arena, travel)
```

### Adding an animal

Add an entry to `js/data/animals.js` with facts, a quiz, a `power` and an `art` spec. The quadruped renderer covers most mammals through parameters such as body length, leg length, neck, head shape, ears, tail, mane, horns and coat pattern. Add the power to `WE.POWERS` in `js/data/habitats.js`.
