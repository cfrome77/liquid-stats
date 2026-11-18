import {
  classifyDrinkCategory,
  DRINK_CATEGORIES,
  drinkMatchesCategory,
  OTHER_CATEGORY,
} from "./beer-category";

describe("beer-category", () => {
  describe("classifyDrinkCategory", () => {
    it("classifies the common beer families", () => {
      expect(classifyDrinkCategory("IPA - American")).toBe("IPA");
      expect(classifyDrinkCategory("India Pale Ale")).toBe("IPA");
      expect(classifyDrinkCategory("Stout - Irish Dry")).toBe("Stout / Porter");
      expect(classifyDrinkCategory("Pilsner - Czech / German")).toBe(
        "Lager / Pilsner",
      );
      expect(classifyDrinkCategory("Hefeweizen")).toBe("Wheat");
      expect(classifyDrinkCategory("Saison")).toBe("Belgian / Farmhouse");
      expect(classifyDrinkCategory("Barleywine")).toBe("Strong Ale");
      expect(classifyDrinkCategory("Lambic - Fruit")).toBe("Sour / Wild");
    });

    it("keeps a porter in Stout / Porter instead of Wine", () => {
      // "porter" contains the substring "port", which the old substring match
      // read as a wine.
      for (const style of ["Baltic Porter", "Porter - Baltic", "Porter"]) {
        expect(classifyDrinkCategory(style)).toBe("Stout / Porter");
        expect(drinkMatchesCategory(style, "Wine")).toBeFalse();
      }
    });

    it("keeps a ginger drink out of the spirit list", () => {
      // "ginger" contains the substring "gin".
      expect(classifyDrinkCategory("Ginger Beer")).not.toBe("Spirit / RTD");
      expect(drinkMatchesCategory("Ginger Beer", "Spirit / RTD")).toBeFalse();
    });

    it("keeps a chocolate drink out of the soda list", () => {
      // "chocolate" contains the substring "cola".
      expect(classifyDrinkCategory("Chocolate Stout")).toBe("Stout / Porter");
      expect(
        drinkMatchesCategory(
          "Chocolate Stout",
          "Non-Alcoholic / Soda / Root Beer",
        ),
      ).toBeFalse();
    });

    it("keeps a steam beer out of the soda list", () => {
      // "steam" contains the substring "tea".
      expect(
        drinkMatchesCategory("Steam Beer", "Non-Alcoholic / Soda / Root Beer"),
      ).toBeFalse();
    });

    it("classifies spirits the old keyword list missed", () => {
      const spirits = [
        "Grappa",
        "Aquavit",
        "Soju",
        "Shochu",
        "Pisco",
        "Cachaça",
        "Baijiu",
        "Eau de Vie",
        "Genever",
        "Schnapps",
        "Ouzo",
        "Armagnac",
        "Calvados",
        "Arak",
        "Pastis",
      ];
      for (const style of spirits) {
        expect(classifyDrinkCategory(style))
          .withContext(style)
          .toBe("Spirit / RTD");
      }
    });

    it("classifies a spirit even when the style also names a beer style", () => {
      // "Barrel Aged" describes the vessel, not the drink.
      expect(classifyDrinkCategory("Whiskey Barrel Aged Stout")).toBe(
        "Stout / Porter",
      );
      expect(classifyDrinkCategory("Rum Barrel Aged Imperial Stout")).toBe(
        "Stout / Porter",
      );
    });

    it("classifies wine and fortified wine styles", () => {
      expect(classifyDrinkCategory("Champagne")).toBe("Wine");
      expect(classifyDrinkCategory("Port - Ruby")).toBe("Wine");
      expect(classifyDrinkCategory("Vermouth")).toBe("Wine");
    });

    it("classifies cider, mead, sake, and non-alcoholic styles", () => {
      expect(classifyDrinkCategory("Apple Cider")).toBe("Cider / Perry / Mead");
      expect(classifyDrinkCategory("Mead")).toBe("Cider / Perry / Mead");
      expect(classifyDrinkCategory("Sake - Junmai")).toBe("Sake");
      expect(classifyDrinkCategory("Root Beer")).toBe(
        "Non-Alcoholic / Soda / Root Beer",
      );
      expect(classifyDrinkCategory("Kombucha")).toBe(
        "Non-Alcoholic / Soda / Root Beer",
      );
    });

    it("handles accented keywords on word boundaries", () => {
      expect(classifyDrinkCategory("Märzen")).toBe("Lager / Pilsner");
      expect(classifyDrinkCategory("Bière de Garde")).toBe(
        "Belgian / Farmhouse",
      );
    });

    it("falls back to Other / Specialty for an unknown or missing style", () => {
      expect(classifyDrinkCategory("Unknown Style")).toBe(OTHER_CATEGORY);
      expect(classifyDrinkCategory("")).toBe(OTHER_CATEGORY);
      expect(classifyDrinkCategory(undefined)).toBe(OTHER_CATEGORY);
    });

    it("always returns a category from the shared list", () => {
      const styles = [
        "IPA",
        "Porter",
        "Mystery Liquid",
        "",
        undefined,
        "Grappa",
      ];
      for (const style of styles) {
        expect(DRINK_CATEGORIES).toContain(classifyDrinkCategory(style));
      }
    });
  });

  describe("drinkMatchesCategory", () => {
    it("matches a drink only in its own category", () => {
      expect(
        drinkMatchesCategory("Baltic Porter", "Stout / Porter"),
      ).toBeTrue();
      expect(drinkMatchesCategory("Baltic Porter", "Wine")).toBeFalse();
      expect(drinkMatchesCategory("Grappa", "Spirit / RTD")).toBeTrue();
      expect(drinkMatchesCategory("Grappa", OTHER_CATEGORY)).toBeFalse();
    });

    it("matches Other / Specialty only for uncategorized drinks", () => {
      expect(drinkMatchesCategory("Mystery Liquid", OTHER_CATEGORY)).toBeTrue();
      expect(drinkMatchesCategory("IPA", OTHER_CATEGORY)).toBeFalse();
      expect(drinkMatchesCategory("Porter", OTHER_CATEGORY)).toBeFalse();
    });
  });
});
