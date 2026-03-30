import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "sortBeerStyles",
  pure: true,
  standalone: true,
})
export class SortBeerStylesPipe implements PipeTransform {
  transform(beerStylesCount: Record<string, number> | undefined): string[] {
    if (!beerStylesCount) return [];
    return Object.keys(beerStylesCount).sort(
      (a, b) => beerStylesCount[b] - beerStylesCount[a],
    );
  }
}
