export const CROC_QUESTIONS = [
  // 🏛️ Classic Architecture & Masonry
  { q: "A recessed landscape design element that creates a vertical barrier while preserving an uninterrupted view is called a what?", a: "A Ha-ha" },
  { q: "The almost triangular space between one side of the outer curve of an arch, a wall, and the ceiling is called a what?", a: "A Spandrel" },
  { q: "A construction filling in the upper angles of a square room so as to form a base to receive an octagonal dome is called a what?", a: "A Squinch" },
  { q: "A grotesque carving on the side of a building that serves no structural purpose and is NOT a waterspout is called a what?", a: "A Hunkey Punk" },
  { q: "Masonry blocks placed specifically at the corner of a wall to reinforce it are called what?", a: "Quoins" },
  { q: "Brickwork built specifically into the empty spaces of a wooden frame is called what?", a: "Nogging" },
  { q: "A small dome, often resembling an overturned cup, placed on a roof to provide ventilation or light is called a what?", a: "A Cupola" },
  { q: "A designated passage situated below or behind a tier of seats in an amphitheater designed for rapid crowd exit is called a what?", a: "A Vomitorium" },
  { q: "A high section of wall that contains windows above eye level to let in light is called a what?", a: "A Clerestory" },
  { q: "A vertical bar separating the panes of glass in a window is called a what?", a: "A Mullion" },
  // 🔨 Construction, Carpentry & Plumbing
  { q: "A U-shaped pipe under a sink designed to hold water and prevent sewer gases from entering a building is called a what?", a: "A P-Trap" },
  { q: "A flat, protective piece of metal placed around a keyhole, door handle, or light switch is called a what?", a: "An Escutcheon" },
  { q: "The exposed underside of an architectural structure, such as an arch, a balcony, or overhanging eaves, is called a what?", a: "A Soffit" },
  { q: "Thin strips of wood or metal attached to a wall to provide a level, flat base for paneling or plasterboard is called what?", a: "Furring" },
  { q: "A bracket or a piece of material used specifically to strengthen an angled joint of a structure is called a what?", a: "A Gusset" },
  { q: "The central supporting, load-bearing pillar of a spiral or winding staircase is called a what?", a: "A Newel" },
  { q: "A horizontal support made of timber, stone, concrete, or steel placed directly across the top of a door or window is called a what?", a: "A Lintel" },
  { q: "Thin pieces of impervious material installed at joints to prevent water from leaking into a structure is called what?", a: "Flashing" },
  { q: "A small opening intentionally left in a masonry wall that allows trapped water to drain out is called a what?", a: "A Weep Hole" },
  { q: "A decorative, ornamental projection placed at the very top, end, or corner of an object or roof is called a what?", a: "A Finial" },
  // 🛋️ Interior Design, Furniture & Decor
  { q: "The lower part of a wall, below about waist height, when it is a different colour or texture than the upper part, is called a what?", a: "A Dado" },
  { q: "Wooden panelling that specifically lines the lower part of the walls of a room is called what?", a: "Wainscoting" },
  { q: "A long, built-in upholstered bench placed along a wall, typically found in a restaurant or dining room, is called a what?", a: "A Banquette" },
  { q: "An elaborate form of wood inlaying used to create decorative patterns on furniture or floors is called what?", a: "Intarsia" },
  { q: "The European artistic interpretation and imitation of Chinese architectural and design traditions is called what?", a: "Chinoiserie" },
  { q: "A large, deeply tufted sofa with padded arms and a back of the exact same height is traditionally called a what?", a: "A Chesterfield" },
  { q: "A composite flooring material consisting of chips of marble, quartz, or glass poured in place with a binder is called what?", a: "Terrazzo" },
  { q: "A small, decorative rug or mat specifically designed to be placed in front of a fireplace is called a what?", a: "A Hearth Rug" },
  { q: "A free-standing closet or wardrobe used for storing clothing is traditionally called a what?", a: "An Armoire" },
  { q: "A specialised, often decorative, device used to alter the acoustics of a room or block harsh sunlight is called a what?", a: "A Baffle" },
  // 🐊 Swamp & Landscape Architecture
  { q: "A low or hollow place in the landscape, especially a marshy depression between ridges used to manage water runoff, is called a what?", a: "A Swale" },
  { q: "A wirework container filled with rock or broken concrete, used in the construction of dams or retaining walls, is called a what?", a: "A Gabion" },
  { q: "Loose, scattered stone used to form a foundation for a breakwater or shore structure to prevent water erosion is called what?", a: "Riprap" },
  { q: "A flat strip of land, raised bank, or terrace specifically bordering a river or canal is called a what?", a: "A Berm" },
  { q: "An architectural structure, like a gazebo or pavilion, built specifically to take advantage of a fine or scenic landscape view is called a what?", a: "A Belvedere" },
  { q: "A small, decorative, rough-hewn structure built in a garden, designed to look like a natural cave is called a what?", a: "A Grotto" },
  { q: "The specific science and study of inland waters, such as lakes, reservoirs, rivers, streams, and wetlands is called what?", a: "Limnology" },
  { q: "A lattice or framework used to support climbing vines and plants in a garden design is called a what?", a: "A Trellis" },
  { q: "The area of land immediately adjacent to a river or stream, acting as a transitional zone between aquatic and terrestrial environments, is called the what?", a: "The Riparian Zone" },
  { q: "A small, shallow, often artificial pond used specifically for breeding or keeping frogs or turtles in a garden setting is called a what?", a: "A Vivarium" },
]

export function getCrocQuestions(count = 8) {
  const shuffled = [...CROC_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
