/**
 * Classifies a drink into one of the Insights categories.
 *
 * Untappd reports every drink — beer, cider, wine, spirit, sake, soda — through
 * the same `beer_style` field, so the category has to be inferred from the
 * style name. Matching is word-based rather than a plain substring test, because
 * a substring test misfires: "port" is inside "porter", "gin" inside "ginger",
 * "cola" inside "chocolate", "tea" inside "steam". A porter would land in the
 * wine list and a ginger beer in the spirits list.
 *
 * The category order matters. The first category whose keyword appears wins, so
 * the sets are ordered from the most specific to the most general. "Other /
 * Specialty" is the fallback and must stay last.
 */

export const DRINK_CATEGORIES = [
  "IPA",
  "Stout / Porter",
  "Sour / Wild",
  "Lager / Pilsner",
  "Pale Ale",
  "Wheat",
  "Belgian / Farmhouse",
  "Strong Ale",
  "Cider / Perry / Mead",
  "Wine",
  "Spirit / RTD",
  "Sake",
  "Non-Alcoholic / Soda / Root Beer",
  "THC / Cannabinoid",
  "Fruit / Field / Spice",
  "Other / Specialty",
] as const;

export type DrinkCategory = (typeof DRINK_CATEGORIES)[number];

export const OTHER_CATEGORY: DrinkCategory = "Other / Specialty";

/**
 * Keyword sets per category, ordered most specific first. Each entry is matched
 * against the whole style name on word boundaries, so "porter" matches a style
 * that contains the word "porter" but not the "port" inside it.
 */
const CATEGORY_KEYWORDS: ReadonlyArray<
  readonly [DrinkCategory, readonly string[]]
> = [
  ["IPA", ["ipa", "india pale ale"]],
  ["Stout / Porter", ["stout", "porter"]],
  [
    "Sour / Wild",
    ["sour", "wild", "gose", "berliner weisse", "lambic", "coolship", "geuze"],
  ],
  [
    "Lager / Pilsner",
    [
      "lager",
      "pilsner",
      "pils",
      "helles",
      "bock",
      "märzen",
      "marzen",
      "kellerbier",
      "dunkel",
      "schwarzbier",
      "vienna",
      "zoigl",
    ],
  ],
  ["Pale Ale", ["pale ale"]],
  [
    "Wheat",
    [
      "wheat",
      "hefeweizen",
      "witbier",
      "dunkelweizen",
      "weizenbock",
      "grisette",
    ],
  ],
  [
    "Belgian / Farmhouse",
    [
      "belgian",
      "abbey",
      "trappist",
      "dubbel",
      "tripel",
      "quadrupel",
      "saison",
      "bière de garde",
      "blonde ale",
      "enkel",
      "patersbier",
    ],
  ],
  [
    "Strong Ale",
    [
      "barleywine",
      "barley wine",
      "old ale",
      "wee heavy",
      "scotch ale",
      "strong ale",
      "doppelsticke",
      "sticke",
    ],
  ],
  [
    "Cider / Perry / Mead",
    ["cider", "perry", "graff", "mead", "cyser", "melomel", "braggot"],
  ],
  [
    "Wine",
    [
      "wine",
      "champagne",
      "prosecco",
      "cava",
      "vermouth",
      "port",
      "sherry",
      "madeira",
      "sangria",
      "spritz",
    ],
  ],
  [
    "Spirit / RTD",
    [
      "spirit",
      "whiskey",
      "whisky",
      "bourbon",
      "scotch",
      "gin",
      "genever",
      "vodka",
      "tequila",
      "mezcal",
      "rum",
      "cachaça",
      "cachaca",
      "brandy",
      "cognac",
      "armagnac",
      "calvados",
      "liqueur",
      "absinthe",
      "aquavit",
      "akvavit",
      "grappa",
      "pisco",
      "soju",
      "shochu",
      "baijiu",
      "schnapps",
      "ouzo",
      "raki",
      "arak",
      "pastis",
      "eau de vie",
      "rtd",
      "cocktail",
    ],
  ],
  ["Sake", ["sake", "junmai", "daiginjo", "honjozo", "nigori"]],
  [
    "Non-Alcoholic / Soda / Root Beer",
    [
      "non-alcoholic",
      "non alcoholic",
      "alcohol free",
      "root beer",
      "soda",
      "cola",
      "ginger ale",
      "kombucha",
      "coffee",
      "tea",
      "malta",
      "fassbrause",
    ],
  ],
  ["THC / Cannabinoid", ["thc", "cannabinoid", "cbd", "hemp"]],
  [
    "Fruit / Field / Spice",
    ["fruit", "shandy", "radler", "pumpkin", "spiced", "herb", "vegetable"],
  ],
];

/** Escapes a keyword so it can be embedded in a regular expression. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Matches a keyword as a whole word. `\b` handles the ASCII boundary; the
 * look-arounds cover the accented keywords (`märzen`, `bière`, `cachaça`) where
 * `\b` does not treat the letter as a word character.
 */
function keywordPattern(keyword: string): RegExp {
  const escaped = escapeRegExp(keyword);
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "u");
}

const CATEGORY_MATCHERS: ReadonlyArray<
  readonly [DrinkCategory, readonly RegExp[]]
> = CATEGORY_KEYWORDS.map(
  ([category, keywords]) => [category, keywords.map(keywordPattern)] as const,
);

/**
 * The category a drink belongs to. Falls back to "Other / Specialty" when no
 * keyword matches, so every drink lands in exactly one category.
 */
export function classifyDrinkCategory(
  beerStyle: string | undefined,
): DrinkCategory {
  const style = (beerStyle ?? "").toLowerCase();
  if (!style.trim()) return OTHER_CATEGORY;

  for (const [category, matchers] of CATEGORY_MATCHERS) {
    if (matchers.some((matcher) => matcher.test(style))) {
      return category;
    }
  }
  return OTHER_CATEGORY;
}

/**
 * Whether a drink belongs to the named category. Shares the classifier with the
 * chart, so the count on a bar and the list behind it always agree. A drink
 * whose category is "Other / Specialty" matches that name and nothing else.
 */
export function drinkMatchesCategory(
  beerStyle: string | undefined,
  categoryName: string,
): boolean {
  return classifyDrinkCategory(beerStyle) === categoryName;
}
