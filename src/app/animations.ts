import {
  trigger,
  transition,
  style,
  query,
  animate,
  group,
} from "@angular/animations";

export const slideInAnimation = trigger("routeAnimations", [
  transition("* <=> *", [
    style({ position: "relative" }),
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          opacity: 0,
        }),
      ],
      { optional: true },
    ),
    query(":enter", [style({ opacity: 0, transform: "translateY(10px)" })], {
      optional: true,
    }),
    group([
      query(
        ":leave",
        [
          animate(
            "200ms ease-out",
            style({ opacity: 0, transform: "translateY(-10px)" }),
          ),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [
          animate(
            "300ms 100ms ease-out",
            style({ opacity: 1, transform: "translateY(0)" }),
          ),
        ],
        { optional: true },
      ),
    ]),
  ]),
]);
