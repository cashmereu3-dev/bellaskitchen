export const MENU_CATEGORIES = [
  {
    id: "wings",
    name: "Wings w/ Fries",
    description: "Served hot with crispy golden fries and a side of dipping sauce.",
    image: "/wings.png",
    isCustomizable: true,
    hasFlavors: true,
    flavors: [
      "Mild",
      "Hot",
      "Honey Hot",
      "Honey BBQ",
      "Honey Hot BBQ",
      "Lemon Pepper",
      "Regular",
      "Garlic Parm",
      "Honey Jalapeno"
    ],
    items: [
      { id: "wings-6", name: "6pc Wings w/ Fries", price: 12.00, size: "6pc combo" },
      { id: "wings-10", name: "10pc Wings w/ Fries", price: 18.00, size: "10pc combo" },
      { id: "wings-20", name: "20pc Wings w/ Fries", price: 28.00, size: "20pc combo" }
    ]
  },
  {
    id: "burgers",
    name: "Burger w/ Fries",
    description: "Juicy patties cooked to perfection, topped with fresh lettuce, pickles, and tomatoes.",
    image: "/burgers.png",
    items: [
      { id: "burger-hamburger", name: "Hamburger", price: 12.00, size: "Single patty combo" },
      { id: "burger-cheeseburger", name: "Cheese Burger", price: 14.00, size: "Classic cheese combo" },
      { id: "burger-baconcheese", name: "Bacon Cheese Burger", price: 16.00, size: "Crispy bacon combo" },
      { id: "burger-geezy", name: "Geezy Burger", price: 18.00, size: "Signature double specialty combo" },
      { id: "burger-seafood", name: "Seafood Burger", price: 20.00, size: "Gourmet seafood patty combo" }
    ]
  },
  {
    id: "chili-dogs",
    name: "Chili/Cheese Dog w/ Fries",
    description: "Plump hot dogs smothered in hot chili and melted cheese sauce.",
    image: "/chili_dogs.png",
    items: [
      { id: "dog-2", name: "2 Chili/Cheese Dogs w/ Fries", price: 10.00, size: "2 Dogs combo" },
      { id: "dog-3", name: "3 Chili/Cheese Dogs w/ Fries", price: 13.75, size: "3 Dogs combo" }
    ]
  },
  {
    id: "egg-rolls",
    name: "Seafood Egg Rolls w/ Fries",
    description: "Crispy fried golden rolls stuffed with seasoned seafood, served with a sweet chili dip.",
    image: "/egg_rolls.png",
    items: [
      { id: "eggroll-3", name: "3pc Seafood Egg Rolls w/ Fries", price: 12.00, size: "3pc combo" }
    ]
  },
  {
    id: "nachos",
    name: "Nachos",
    description: "Crispy tortilla chips loaded with hot melted cheese sauce, jalapeños, and premium proteins.",
    image: "/nachos.png",
    items: [
      { id: "nacho-beef", name: "Beef Nachos", price: 12.00, size: "Classic beef loaded platter" },
      { id: "nacho-shrimp", name: "Shrimp Nachos", price: 15.00, size: "Premium grilled shrimp platter" },
      { id: "nacho-crawfish", name: "Crawfish Nachos", price: 16.00, size: "Louisiana cajun crawfish loaded" },
      { id: "nacho-seafood", name: "Seafood Nachos", price: 18.00, size: "Ultimate shrimp & crawfish combo platter" }
    ]
  },
  {
    id: "tacos",
    name: "3 Tacos w/ Fries",
    description: "Soft street taco shells packed with seasoned meats, fresh cilantro, onions, and sauces.",
    image: "/tacos.png",
    items: [
      { id: "taco-beef", name: "3 Beef Tacos w/ Fries", price: 12.00, size: "3 Tacos combo" },
      { id: "taco-chicken", name: "3 Chicken Tacos w/ Fries", price: 12.00, size: "3 Tacos combo" },
      { id: "taco-shrimp", name: "3 Shrimp Tacos w/ Fries", price: 15.00, size: "3 Grilled shrimp combo" }
    ]
  },
  {
    id: "quesadillas",
    name: "Quesadillas w/ Fries",
    description: "Large flour tortillas toasted golden with cheese blends, served with salsa dipping cups.",
    image: "/quesadillas.png",
    items: [
      { id: "quesadilla-beef", name: "Beef Quesadilla w/ Fries", price: 12.00, size: "Beef fold combo" },
      { id: "quesadilla-chicken", name: "Chicken Quesadilla w/ Fries", price: 12.00, size: "Chicken fold combo" },
      { id: "quesadilla-shrimp", name: "Shrimp Quesadilla w/ Fries", price: 15.00, size: "Shrimp fold combo" }
    ]
  },
  {
    id: "club-box",
    name: "Other Specialties / Club Box",
    description: "Signature Diner club stack options served crispy with fries and coleslaw cup.",
    image: "/club_box.png",
    items: [
      { id: "spec-club", name: "Club Box Combo", price: 16.00, size: "Club sandwich stack combo" }
    ]
  },
  {
    id: "fried-specialties",
    name: "Fried Specialties / Pork Chops & Ribs",
    description: "Deeply seasoned fried pork chop plates or slow-grilled honey BBQ rib slabs.",
    image: "/fried_specialties.png",
    items: [
      { id: "fried-pork", name: "Fried Pork Chop Plate", price: 15.00, size: "Double chop dinner platter" },
      { id: "fried-ribs", name: "BBQ Rib Slab Combo", price: 18.00, size: "Slow cooked rib combo platter" }
    ]
  },
  {
    id: "mega-box",
    name: "Mega Box Platters",
    description: "Giant multi-person box combo containing a mix of wings, egg rolls, sliders, and fries.",
    image: "/mega_box.png",
    items: [
      { id: "mega-combo", name: "Mega Box Combo", price: 25.00, size: "Full sampler box platter" }
    ]
  },
  {
    id: "loaded-fries",
    name: "Loaded Fries",
    description: "Giant shareable tray of crispy fries topped with cheddar cheese, bacon bits, ranch, and green onions.",
    image: "/loaded_fries.png",
    items: [
      { id: "fries-loaded", name: "Fully Loaded Fries", price: 10.00, size: "Loaded party platter" }
    ]
  },
  {
    id: "drinks",
    name: "Drinks & Snacks",
    description: "Refreshing sweetened iced tea brands, hand-crafted exotic punches, and simple snack bags.",
    image: "/drinks.png",
    items: [
      { id: "drink-peach", name: "Lipton Peach Tea", price: 3.00, size: "Bottled iced tea" },
      { id: "drink-green", name: "Lipton Honey Green Tea", price: 3.00, size: "Bottled green tea" },
      { id: "drink-sweet", name: "Gold Peak Sweet Tea", price: 3.00, size: "Bottled sweet tea" },
      { id: "drink-punch", name: "Exotic Peach Punch", price: 4.00, size: "Signature cup drink" },
      { id: "drink-fries", name: "Side of French Fries", price: 4.00, size: "Crispy fries basket" }
    ]
  }
];