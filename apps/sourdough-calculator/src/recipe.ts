import type { CalculatorResult } from './calculator'
import { formatGramsPlain } from './format'

/** Full bake instructions — appended after calculated weights when printing. */
export const RECIPE_TITLE = 'Very Slow Sourdough'

export function renderRecipePrint(result: CalculatorResult): string {
  const levainFlour = formatGramsPlain(result.leavenFlourG)
  const levainWater = formatGramsPlain(result.leavenWaterG)
  const starter = formatGramsPlain(result.starterG)
  const breadFlour = formatGramsPlain(result.doughFlourG)
  const breadWater = formatGramsPlain(result.doughWaterG)
  const salt = formatGramsPlain(result.doughSaltG)
  const levain = formatGramsPlain(result.totalLeavenG)

  return `
    <article class="recipe-card">
      <header class="recipe-card__header">
        <h2 class="recipe-card__title">${RECIPE_TITLE}</h2>
      </header>

      <section class="recipe-card__section">
        <h3 class="recipe-card__heading">Ingredients</h3>

        <div class="recipe-card__ingredient-groups">
          <div class="recipe-card__ingredient-group">
            <h4 class="recipe-card__subheading">Levain</h4>
            <ul class="recipe-card__list">
              <li><span class="recipe-card__amount">${levainFlour}g</span> bread flour</li>
              <li><span class="recipe-card__amount">${levainWater}g</span> water</li>
              <li><span class="recipe-card__amount">${starter}g</span> starter</li>
            </ul>
          </div>

          <div class="recipe-card__ingredient-group">
            <h4 class="recipe-card__subheading">Bread</h4>
            <ul class="recipe-card__list">
              <li><span class="recipe-card__amount">${breadFlour}g</span> bread flour</li>
              <li><span class="recipe-card__amount">${breadWater}g</span> water</li>
              <li><span class="recipe-card__amount">${salt}g</span> salt</li>
              <li><span class="recipe-card__amount">${levain}g</span> levain</li>
            </ul>
          </div>
        </div>

        <p class="recipe-card__note">
          The levain is a big batch of starter at 100% hydration.
        </p>
      </section>

      <section class="recipe-card__section">
        <h3 class="recipe-card__heading">Directions</h3>

        <section class="recipe-card__step">
          <h4 class="recipe-card__subheading">Levain</h4>
          <p>
            Mix starter, flour, and water as you would when feeding starter. Use a
            chopstick for minimal waste. Allow to rise until fully active, about 8 hours.
          </p>
        </section>

        <section class="recipe-card__step">
          <h4 class="recipe-card__subheading">Autolyse</h4>
          <p>
            Combine the levain, flour, and water until uniform. Cover and let sit for
            30 minutes. Salt can be added here if you prefer; it still comes out fine.
          </p>
        </section>

        <section class="recipe-card__step">
          <h4 class="recipe-card__subheading">Salt</h4>
          <p>
            Add the salt and fold in until reasonably mixed. The dough may behave poorly
            and stick. Let stand in a warm place for 30 minutes.
          </p>
        </section>

        <section class="recipe-card__step">
          <h4 class="recipe-card__subheading">Folds</h4>
          <p>Do four stretch-and-folds at 30-minute intervals.</p>
        </section>

        <section class="recipe-card__step">
          <h4 class="recipe-card__subheading">Rise</h4>
          <p>
            Let the dough rise in a warm location until doubled in volume. Time will be
            measured in hours.
          </p>
        </section>

        <section class="recipe-card__step">
          <h4 class="recipe-card__subheading">Shape and rest</h4>
          <p>
            Build surface tension and a smooth surface by gently cupping your hands under
            the dough on a floured surface. Stretch the surface and fold it into the
            bottom of the dough until it feels taut rather than relaxed. Cover with a
            towel and rest for 30 minutes on the board.
          </p>
        </section>

        <section class="recipe-card__step">
          <h4 class="recipe-card__subheading">Final proof</h4>
          <p>
            Lightly flour the surface again and place the dough top-down so the smooth
            side is on the board. Fold the sides in to form a rectangle, then roll up
            along the length, stretching slightly and keeping it tight. Pinch the seam
            closed.
          </p>
          <p>
            Put the dough, seam side down, into a greased pan. Cover and let rise until
            the pan is mostly filled. It will finish rising in the refrigerator. For a
            pullman loaf, put the lid on and leave it on. Otherwise, cover the dough so
            it does not dry out.
          </p>
        </section>

        <section class="recipe-card__step">
          <h4 class="recipe-card__subheading">Cold ferment</h4>
          <p>
            Refrigerate overnight, or as long as needed, until the dough finishes rising
            or comes close. If it has not finished, take it out and let it finish at
            room temperature.
          </p>
        </section>

        <section class="recipe-card__step">
          <h4 class="recipe-card__subheading">Score</h4>
          <p>
            For a regular loaf, score the surface just before baking so it can spring at
            a weak point. For a pullman pan, skip scoring.
          </p>
        </section>

        <section class="recipe-card__step">
          <h4 class="recipe-card__subheading">Bake</h4>
          <p>
            Lightly spray the surface with water or use another steaming method if you wish.
          </p>
          <ul class="recipe-card__list">
            <li>Bake at 400°F for 20 minutes</li>
            <li>Reduce to 350°F for 20 more minutes</li>
            <li>Internal temperature should reach about 200°F</li>
            <li>
              If baking without a lid, cover with foil for the last 20 minutes to prevent
              over-browning
            </li>
          </ul>
        </section>
      </section>

      <section class="recipe-card__section recipe-card__section--notes">
        <h3 class="recipe-card__heading">Notes</h3>
        <ul class="recipe-card__list recipe-card__list--notes">
          <li>
            Flour and water will form gluten without mixing. Autolyse is the lazy way to
            knead the bread. Salt interferes with gluten formation.
          </li>
          <li>
            Temperature mainly changes rise time. A cold counter in a cold room works; it
            just takes longer. Cooler temps can also shift yeast vs. bacterial activity
            toward a more sour loaf. That is one reason for the cold ferment at the end.
          </li>
          <li>
            Baker&apos;s percentages compare the weight of each ingredient to the weight of
            the flour. An 80% hydration dough, suitable for a pan or flatter bread, has 80%
            of the flour weight in water.
          </li>
        </ul>
      </section>
    </article>
  `
}
