/*
 * ─────────────────────────────────────────────────────────────
 *  YOUR CONTENT LIVES HERE.
 *  Edit SITE for shop-wide settings and BUILDS for each project.
 *  Every build below is an EXAMPLE (example: true shows a badge on
 *  the site). Replace them with your real builds, then delete the
 *  `example` line. See README.md for every field.
 * ─────────────────────────────────────────────────────────────
 */

window.SITE = {
  name: "Layer by Layer",
  tagline: "Printable builds that teach how things work.",
  currency: "USD",
  contactEmail: "hello@example.com",        // shown in the footer and FAQ
  bundle: {                                  // optional "all files" deal; set to null to hide
    name: "Every build, every file",
    price: 14,
    stripeLink: "",                          // e.g. "https://buy.stripe.com/abc123"
  },
};

window.BUILDS = [
  {
    id: "flapping-owl",
    example: true,
    name: "The Flapping Owl",
    tagline: "Turn the crank and the wings really flap.",
    category: "Moving toys",
    difficulty: "Beginner",
    model: { type: "owl" },                  // or { stl: "models/flapping-owl.stl" }
    price: 4,
    stripeLink: "",                          // paste the Stripe Payment Link for this build
    plansPdf: "",                            // optional free PDF, e.g. "plans/flapping-owl.pdf"
    stats: { printHours: 6.5, filamentGrams: 85, parts: 9, material: "PLA" },
    learn: ["Gear ratios", "Turning spin into up-and-down", "Fit and tolerance"],
    description:
      "A tabletop owl whose wings flap when you turn a hand crank. A small gear drives a big one, and a slider turns the spin into a flap. Great first build with a young helper.",
    settings: { nozzle: "0.4 mm", layer: "0.2 mm", infill: "15% gyroid", walls: "3", supports: "None", plate: "PEI, 60 °C" },
    bom: [
      { qty: 1, item: "Base plate" },
      { qty: 1, item: "Little gear (14 teeth)" },
      { qty: 1, item: "Big gear (28 teeth)" },
      { qty: 2, item: "Wings (left and right)" },
      { qty: 1, item: "Slider yoke" },
      { qty: 1, item: "Crank arm and handle" },
      { qty: 1, item: "Owl face" },
      { qty: 2, item: "M3 × 12 mm screws (or 3 mm filament as pins)" },
    ],
    steps: [
      { title: "Print the parts", text: "Print the base and gears flat side down. Print the wings on their backs so the feather lines face up." },
      { title: "Clean the holes", text: "Run a 3 mm drill bit by hand through each axle hole so the gears spin freely." },
      { title: "Mount the gears", text: "Press the little gear onto the crank axle and the big gear beside it. Check that the teeth mesh without binding." },
      { title: "Add the slider", text: "Clip the slider onto the pin on the big gear. Turning the crank should move the slider up and down." },
      { title: "Attach the wings", text: "Hook each wing onto the slider rods, then onto the pivot pins on the owl's shoulders." },
      { title: "Face and test", text: "Snap on the owl face. Turn the crank slowly at first, then fast. Move the pin to a farther hole for bigger flaps." },
    ],
    tips: "If the gears bind, sand the tooth tips lightly or scale the gears to 99%.",
  },
  {
    id: "planetary-fidget",
    example: true,
    name: "Planetary Gear Fidget",
    tagline: "Three planets orbit a sun inside a ring.",
    category: "Moving toys",
    difficulty: "Intermediate",
    model: { type: "planetary" },
    price: 3,
    stripeLink: "",
    plansPdf: "",
    stats: { printHours: 3, filamentGrams: 40, parts: 5, material: "PLA or PETG" },
    learn: ["Planetary gear trains", "Print-in-place clearances", "Why a sun gear turns faster"],
    description:
      "A palm-sized fidget that shows how car gearboxes and electric screwdrivers multiply force. Spin the sun and watch the planets walk around the ring.",
    settings: { nozzle: "0.4 mm", layer: "0.16 mm", infill: "20% grid", walls: "3", supports: "None", plate: "Textured PEI" },
    bom: [
      { qty: 1, item: "Ring gear" },
      { qty: 1, item: "Sun gear with knob" },
      { qty: 3, item: "Planet gears" },
    ],
    steps: [
      { title: "Calibrate first", text: "Print the included clearance test. If the 0.3 mm gap moves freely, print the fidget as is." },
      { title: "Print flat", text: "Print all gears flat. A slower first layer helps the teeth stay crisp." },
      { title: "Drop in the planets", text: "Set the sun in the middle, then slide the three planets in around it, one at a time." },
      { title: "Break it in", text: "Spin it 50 times or so. It will get smoother as the teeth wear in." },
    ],
    tips: "Count the turns: the sun spins about 4 times for each lap of the planets.",
  },
  {
    id: "cable-dock",
    example: true,
    name: "Desk Cable Dock",
    tagline: "Five slots that keep chargers from sliding off the desk.",
    category: "Home and desk",
    difficulty: "Beginner",
    model: { type: "cable" },
    price: 2,
    stripeLink: "",
    plansPdf: "",
    stats: { printHours: 1.5, filamentGrams: 22, parts: 1, material: "PETG" },
    learn: ["Designing for flex", "Print orientation and strength", "Weighted bases"],
    description:
      "A weighted dock with five cable slots. It is a good lesson in why a part printed one way snaps and the other way bends.",
    settings: { nozzle: "0.4 mm", layer: "0.2 mm", infill: "40% cubic", walls: "4", supports: "None", plate: "PEI, 75 °C" },
    bom: [
      { qty: 1, item: "Cable dock body" },
      { qty: 4, item: "Rubber feet (optional)" },
      { qty: 5, item: "Coins or washers for weight (optional)" },
    ],
    steps: [
      { title: "Print on its back", text: "Lay it flat on the bed so the slot fingers print along their length. That way they bend instead of snap." },
      { title: "Pause for weight", text: "Add a pause at the layer shown in the file, drop in coins, and let the printer close the lid over them." },
      { title: "Finish", text: "Stick on rubber feet and press your cables into the slots." },
    ],
    tips: "PETG flexes better than PLA here. PLA works but may crack after many uses.",
  },
  {
    id: "self-watering-pot",
    example: true,
    name: "Self-Watering Planter",
    tagline: "A wick pulls water up to the roots by itself.",
    category: "Garden",
    difficulty: "Beginner",
    model: { type: "planter" },
    price: 3,
    stripeLink: "",
    plansPdf: "",
    stats: { printHours: 8, filamentGrams: 140, parts: 2, material: "PETG" },
    learn: ["Capillary action", "Watertight prints", "Vase mode"],
    description:
      "Two nested pots: a water tank below and a soil cup on top joined by a cotton wick. A hands-on way to see capillary action at work.",
    settings: { nozzle: "0.4 mm", layer: "0.24 mm", infill: "10%", walls: "3 (watertight)", supports: "None", plate: "PEI, 75 °C" },
    bom: [
      { qty: 1, item: "Water tank" },
      { qty: 1, item: "Soil cup" },
      { qty: 1, item: "Cotton wick, 15 cm (shoelace works)" },
    ],
    steps: [
      { title: "Print the tank", text: "Use 3 walls and slightly higher temperature so the layers fuse watertight. Fill it with water to test." },
      { title: "Print the cup", text: "The cup prints upright with no supports." },
      { title: "Thread the wick", text: "Push the wick through the hole in the cup so half hangs into the tank." },
      { title: "Plant", text: "Fill with soil, plant, and top up the tank once a week." },
    ],
    tips: "Food-safe claims need special filament and sealing. Use this for plants only.",
  },
  {
    id: "phone-stand",
    example: true,
    name: "Fold-Flat Phone Stand",
    tagline: "A living hinge that folds flat into a pocket.",
    category: "Home and desk",
    difficulty: "Advanced",
    model: { type: "stand" },
    price: 3,
    stripeLink: "",
    plansPdf: "",
    stats: { printHours: 2, filamentGrams: 30, parts: 1, material: "PETG or TPU" },
    learn: ["Living hinges", "Material fatigue", "Center of gravity"],
    description:
      "A one-piece stand with a thin flexible hinge. It holds a phone at three angles and folds flat when you are done.",
    settings: { nozzle: "0.4 mm", layer: "0.2 mm", infill: "100% at the hinge", walls: "2", supports: "None", plate: "Smooth PEI" },
    bom: [{ qty: 1, item: "Phone stand (single part)" }],
    steps: [
      { title: "Print flat", text: "The hinge must print in the first few layers so its plastic lines run across the fold." },
      { title: "Flex it warm", text: "Right after it comes off the bed, fold the hinge back and forth a few times. This makes it last longer." },
      { title: "Pick an angle", text: "Rest the back leg in one of the three notches." },
    ],
    tips: "PLA hinges crack fast. PETG lasts hundreds of folds, and TPU lasts almost forever.",
  },
];
