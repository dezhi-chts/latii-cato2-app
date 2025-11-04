const descriptionsMap: Record<string, string> = {
  brass:
    "OT67 copper alloy, this material undergoes cold-working to amplify its unique color, shine, durability, and corrosion resistance",
  corten_steel:
    "Boasts 6-8 times more corrosion resistance and double the tensile strength compared to traditional steels.",
  galvanized_steel:
    "Exceptional corrosion resistance and tensile strength, enabling the creation of high-performing, slender fixtures on a large scale.",
  stainless_steel:
    "Industrial pre-treatment and cold-rolling enhance rust resistance. Iron, carbon, nickel, and molybde-num excel under exposure.",
  solar_max:
    "Low-E ideal for extensive sunny, warm environments; reduces heat and allows less natural light to pass, glass less transparent. Corresponds to SNX 70 and Solarban 90.",
  therma_balance:
    "Low-E ideal for moderate sunshine; the coating balances natural heating and light passing through the glass. Corresponds to SNX 60 and Solarban 70.",
  clima_clear:
    "Low-E ideal for less sunshine and colder climates; coating allows natural heating and light to pass through, glass more transparent. Corresponds to SNX 50 and Solarban 60.",
  ultra_view:
    "Ideal for sunshine and colder climates; no coating allows all natural heating and light to pass through glass.",
  nailing_fins:
    "For new construction, we recommend fastening through the exterior for a secure, weather-tight fit that works well with flashing.",
  through_jamb:
    "For replacements or remodels, interior fastening is ideal, providing strong support without disturbing exterior finishes.",
  bella:
    "Standard line. Minimalistic steel profile ideal for clean, contemporary aesthetics. Use unless specific design or structural needs dictate otherwise.",
  bella_indoor:
    "Our Non-Thermally Broken Line offers a minimalistic steel profile for indoor windows and doors, creating a perfectly clean, contemporary aesthetic.",
  vista:
    "Use when a more traditional or robust steel frame is desired, or when dimensions exceed the Bella line's limits.",
  murano:
    "Choose for a decorative, beveled look on both interior and exterior. Always paired with a beveled glazing bead.",
  castelo:
    "Use for a Gothic or historical aesthetic. Features ornamental profiles, paired with a gothic glazing bead.",
  goya_plus: "For operable windows only. Do not use for fixed units.",
  goya_hs:
    "Use when consistent exterior aesthetics are needed between operable and fixed units. Only compatible with inswing units.",
  goya: "For fixed (non-operable) windows only. Maintains visual consistency with operable GOYA lines.",
  dali_fold:
    "For folding door systems only. Not suitable for sliding or swing applications.",
  dali_slide:
    "For standard sliding door applications, unless size or flush threshold requirements apply.",
  dali_slide_plus:
    "Use for sliding doors that require a flush threshold or exceed the size/rail limits of the DALI Slide.",
  dali_swing:
    "For swing doors only. Not compatible with folding or pivot systems.",
  dali_pivot:
    "For pivot door systems only. Ideal for dramatic entrances or large-format doors.",
  powder_coating:
    "An organic powder layer via electrostatic deposition, creates a highly durable surface that resists severe weather.",
  anodized:
    "Thickening its natural oxide coating significantly enhances aluminum's durability and resistance to corrosion, ideal for use in harsh climates.",
  laminated_wood:
    "Significantly more durable than solid wood, providing superior dimensional stability that resists warping and cracking.",
};

export const getDescriptionFromKey = (key: string): string | null => {
  const formattedKey = key.toLowerCase().replace(/[-\s]/g, "_");
  return descriptionsMap[formattedKey] || null;
};
