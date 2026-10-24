# Fossil Finders

A paleontology dig game for the browser. You are a paleontologist working 16 real fossil sites. You chip, scrape and brush away the rock to uncover dinosaur bones and other prehistoric fossils. Then you jacket the bones in plaster, rebuild the skeleton in the lab, and put it on display in your own museum.

It is a separate game from WildDex Explorer. It shares that game's creature facts and drawing code, so the animal you dig up matches its WildDex entry. All art is drawn in code: no image files, no emoji.

## How to play

Open `index.html` in a modern browser. Double-clicking works, and no server is needed. Keep the `wildlife-explorer` folder next to `fossil-dig`, because the game loads the shared creature data and art from there. Progress saves in your browser.

1. **Choose a dig.** The expedition map shows each site on a world map, with its rock type and a clue. Each finished dig unlocks the next one.
2. **Dig.** Use the right tool for each layer:

   | Tool | Key | Use it for |
   | --- | --- | --- |
   | Rock pick | 1 or P | Hard grey rock. It is too rough near bone and can crack it. |
   | Trowel | 2 or T | Loose dirt. It scratches bone if you scrape bare fossil. |
   | Brush | 3 or B | Fine dust over the bone. It never damages anything. |

   Bone chips on the surface are clues to where the skeleton lies. The quarry grid (A–L, 1–8) and the scale bar work like a real field map. **Hint** marks a grid square to try.
3. **Jacket.** When a bone is uncovered, tap **Jacket it!** to wrap it in plaster and carry it to the lab. Some digs also hide bonus finds, such as shark teeth, coprolites, eggshell, fossil leaves and petrified wood. These go into your curiosity cabinet.
4. **Lab.** Drag each bone from the tray onto the skeleton outline. If you drop it in the wrong place, its spot glows next time. Bones you left in the ground are cast in plaster, just as museums do.
5. **Mount and identify.** Put the skeleton on its steel frame, guess which animal it is, and then see it come to life.

Each dig earns up to 3 stars: one for recovering at least 90% of the bones, one for keeping them in good condition, and one for a correct identification.

## The 16 digs

| # | Fossil | Site | Age |
| --- | --- | --- | --- |
| 1 | Ammonite (training dig) | Bearpaw Shale, Alberta | 75 million years |
| 2 | Psittacosaurus | Yixian Formation, Liaoning, China | 125 |
| 3 | Protoceratops | Flaming Cliffs, Gobi Desert | 75 |
| 4 | Archaeopteryx | Solnhofen, Bavaria | 150 |
| 5 | Velociraptor | Tugrikin Shireh, Gobi Desert | 75 |
| 6 | Herrerasaurus | Ischigualasto, Argentina | 231 |
| 7 | Stegosaurus | Garden Park, Colorado | 150 |
| 8 | Pteranodon | Smoky Hill Chalk, Kansas | 85 |
| 9 | Allosaurus | Cleveland-Lloyd Quarry, Utah | 150 |
| 10 | Triceratops | Hell Creek, Montana | 66 |
| 11 | Elasmosaurus | Pierre Shale, Kansas | 80 |
| 12 | Edmontosaurus | Hell Creek, Montana | 66 |
| 13 | Spinosaurus | Kem Kem Beds, Morocco | 95 |
| 14 | Tylosaurus | Smoky Hill Chalk, Kansas | 85 |
| 15 | Diplodocus | Carnegie Quarry, Utah | 150 |
| 16 | Tyrannosaurus rex | Hell Creek, Montana | 67 |

Each site has its own rock and bone colours. For example, Hell Creek has dark brown bones in grey-tan sandstone, the Gobi has white bones in red sand, and Solnhofen has brown bones in cream limestone. Pterosaurs, marine reptiles and the ammonite are found flattened in a rock slab, so they go on display in their slab.

## Project layout

```
index.html        page shell (loads shared code from ../wildlife-explorer/js)
css/style.css     field-camp UI
js/skeletons.js   builds bone pieces (skull, jaw, vertebrae, ribs, hips, limbs, plates, frills...)
                  from the WildDex creature anatomy, and draws them as textured fossil bone
js/digdata.js     dig sites, rock styles, clues, field tips, the ammonite entry
js/dig.js         the excavation: rock/dirt/dust layers, tools, damage, plaster jackets, bonus finds
js/lab.js         skeleton assembly, plaster casts, museum mount and life reveal
js/sfx.js         synthesised sound effects (Web Audio)
js/app.js         screens, HUD, save data and the main loop
```

Skeletons are generated from the same anatomy numbers (body length, hip height, neck, head shape, tail, plates, sail and so on) that WildDex uses to draw the living animal. That is why the mounted skeleton lines up with the life reconstruction.
