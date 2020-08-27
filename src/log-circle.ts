import {Computed, dom, DomElementArg, DomContents, MultiHolder, Observable, styled} from 'grainjs';

interface Mark {
  value: number;
  label: DomContents;
}


function buildMarks(densityLevel: number): Mark[] {
  console.log("buildMarks", densityLevel);
  // Let's say we initially display N=10 ticks between 0 and 1.
  //    Let's call it densityLevel 1.
  // A new level of ticks (twice denser, level 2) appears for 1/stretch<=3/4, and remains the highest
  // level while 1/stretch > 3/8.
  //    => log2(s) in (log2(3/8), log2(3/4)] = log2(3) - (3, 2]
  //    => log2(3) - log2(s) in [2, 3)
  //    => Math.floor(log2(3) - log2(s)) == 2
  //    => densityLevel = Math.floor(log2(3) - log2(s)) = Math.floor(log2(3) + log2(stretch))
  // This new level of ticks covers the interval until 1/2, i.e. Math.pow(2, 1 - densityLevel)
  // Can drop ticks at densityLevel 1 once stretch <= 1/4 (densityLevel 3) appears by that point.
  // OK to say we'll drop ticks at level 1 once densityLevel 4 appears.
  // Ticks NOT dropped will be hidden when needed.
  const marks: Mark[] = [];
  const N = 100;
  let start = 0;
  for (let d = densityLevel; d >= densityLevel - 2; d--) {
    const maxTick = Math.pow(2, 1 - d);
    const count = (d === densityLevel ? N : N / 2);
    for (let i = 0; i < count; i++) {
      const value = start + maxTick * i / N;
      const label = i % 10 === 0 ? frac(start + maxTick * i / N) : null;
      marks.push({value, label});
    }
    start = maxTick;
  }
  console.log("BUILT", marks.length, "MARKS");
  return marks;

  /*
  const frets = [...Array(12)].map((_, i) => {
    const value = Math.pow(2, -i/12);
    const label = frac(`F${i}`, undefined, cssFrac.cls('-lower1'));
    return {value, label};
  });
  */
  // const N = 10 * Math.pow(2, scaleBase2);
  // return [
  //   ...[...Array(N * 10 + 1)].map((_, i) => {
  //     const value = i / N / 10;
  //     const label = i % 10 === 0 ? frac(i / 10 / N) : null;
  //     return {value, label};
  //   }),

  //   /*
  //   {value: 1, label: frac(1)},
  //   {value: 3/4, label: frac(3, 4)},
  //   {value: 2/3, label: frac(2, 3)},
  //   {value: 1/2, label: frac(1, 2)},
  //   {value: 1/3, label: frac(1, 3)},
  //   {value: 1/4, label: frac(1, 4)},
  //   {value: 0, label: frac(0)},
  //   */
  //   /*
  //   {value: 1, label: frac(1)},
  //   {value: 8/9, label: frac(8, 9)},
  //   {value: 4/5, label: frac(4, 5)},
  //   {value: 3/4, label: frac(3, 4)},
  //   {value: 2/3, label: frac(2, 3)},
  //   {value: 3/5, label: frac(3, 5)},
  //   {value: 8/15, label: frac(8, 15)},
  //   {value: 1/2, label: frac(1, 2)},
  //   {value: 4/9, label: frac(4, 9)},
  //   {value: 2/5, label: frac(2, 5)},
  //   {value: 1/3, label: frac(1, 3)},
  //   {value: 1/4, label: frac(1, 4)},
  //   {value: 1/5, label: frac(1, 5)},
  //   {value: 0, label: frac(0)},
  //   {value: 16/27, label: frac(16, 27, cssFrac.cls('-lower2'))},
  //   {value: 64/81, label: frac(64, 81, cssFrac.cls('-lower2'))},
  //   {value: 128/243, label: frac(128, 243, cssFrac.cls('-lower2'))},
  //   {value: 512/729, label: frac(512, 729, cssFrac.cls('-lower2'))},
  //   ...frets
  //   */
  // ];
}


// If the string is stretched so that the left-most number is t, then:
// - the circle has wrapped integral (1 -> t) of L/x, i.e. L*ln(t).
// - let circleFactor r = R / L (e.g. 0.25)
// - with radius R, that's angle = ln(t) / r radians.
// - therefore stretch t is Math.exp(angle * r)
// - mark m is at angle ln(m) / r radians.
// - for music, want ln(1/2)/r = 2pi => r=ln(1/2)/2pi=ln2/2pi = R/L.
//   R+L = 100% => R=100%/(1+1/r)=100%/(1+2pi/ln2)

const circleFactor = Math.LN2 / (2*Math.PI);
const circleRadiusPercent = 100 / (1 + 1 / circleFactor);

function buildPage() {
  return cssPage(
    cssSection(
      cssSectionTitle("String Length"),
      dom.create(buildLogCircle),
    )
  );
}

function buildLogCircle(owner: MultiHolder) {
  const angle = Observable.create(owner, 0);
  const stretch = Computed.create(owner, angle, (use, a) => Math.exp(-a * circleFactor));
  const densityLevel = Computed.create(owner, stretch, (use, s) => Math.floor(Math.log2(3) + Math.log2(s)));
  densityLevel.addListener((d) => console.log("stretch", stretch.get(), "densityLevel", d));
  const rulerMarks = Computed.create<Mark[]>(owner, use => buildMarks(use(densityLevel)));
  const circleMarks = Computed.create<Mark[]>(owner, use => buildMarks(use(densityLevel)));

  return cssLogCircle(
    cssCirclePart(
      dom.style('transform', (use) => `rotate(${use(angle)}rad)`),
      cssCircleDrag(
        dom.on('mousedown', (ev, elem) => rotate(ev, elem as HTMLElement, angle)),
      ),
      dom.forEach(rulerMarks, ({label, value}) =>
        cssMarkCircle(cssTick(cssTick.cls('-short', !label)), label,
          dom.show((use) => {
            const k = value * use(stretch);
            return k >= 1 && k < 2 && value <= 1;
          }),
          (elem) => { setTimeout(() => showCircleMark(elem, value), 0); },
        )
      )
    ),
    cssFlatPart(
      cssRuler(
        dom.forEach(circleMarks, ({label, value}) =>
          cssMark(cssTick(cssTick.cls('-short', !label)), label,
            dom.show((use) => value * use(stretch) < 1),
            dom.style('right', (use) => (value * use(stretch) * 100) + '%')
          ),
        )
      )
    )
  );
}

function showCircleMark(elem: HTMLElement, value: number) {
  const angle = -Math.log(value) / circleFactor
  elem.style.transform = `rotate(${angle}rad)`;
}

function rotate(startEv: MouseEvent, elem: HTMLElement, angle: Observable<number>) {
  const rect = elem.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const startAngle = Math.atan2(startEv.clientY - centerY, startEv.clientX - centerX);
  if (isNaN(startAngle)) { return; }
  const angleOffset = angle.get() - startAngle;

  const upLis = dom.onElem(document, 'mouseup', onStop, {useCapture: true});
  const moveLis = dom.onElem(document, 'mousemove', onMove, {useCapture: true});

  startEv.preventDefault();
  function onStop(stopEv: MouseEvent) {
    moveLis.dispose();
    upLis.dispose();
  }
  function onMove(moveEv: MouseEvent) {
    let newAngle = Math.atan2(moveEv.clientY - centerY, moveEv.clientX - centerX);
    if (isNaN(newAngle)) { return; }
    angle.set(findCloseCopy(angleOffset + newAngle, angle.get()));
  }
}

// Add full turns to an angle to make it as close to refAngle as possible.
function findCloseCopy(angle: number, refAngle: number) {
  return angle + Math.round((refAngle - angle) / (2 * Math.PI)) * 2 * Math.PI;
}

export function frac(numer: number|string, denom?: number|string, ...args: DomElementArg[]) {
  return cssFrac(cssFracPart('' + numer),
    denom ? cssFracPart('' + denom) : null,
    ...args);
}

const cssPage = styled('div', `
  box-sizing: border-box;
  font-family: sans-serif;
  position: relative;
  margin: 40px;
  --overlay-color: rgba(230, 200, 250);
  display: flex;
  flex-wrap: wrap;
  align-items: top;

  *, *:before, *:after {
  -webkit-box-sizing: border-box;
     -moz-box-sizing: border-box;
          box-sizing: border-box;
  }
`);

const cssSection = styled('div', `
  flex: auto;
  &:not(:last-child) {
    margin-right: 40px;
  }
`);

const cssSectionTitle = styled('div', `
  margin: 20px;
  text-align: center;
  font-size: larger;
`);

const cssLogCircle = styled('div', `
  display: flex;
`);

const cssCirclePart = styled('div', `
  position: relative;
  border: 3px solid #00ca00;
  border-radius: 100%;
  width: ${circleRadiusPercent * 2}%;
  margin-right: -${circleRadiusPercent}%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  &:after {
    content: "";
    display: block;
    padding-bottom: 100%;
  }
`);

const cssCircleDrag = styled('div', `
  position: absolute;
  top: 0px;
  left: 0px;
  border: 48px solid #ddd;
  border-radius: 100%;
  width: 80%;
  height: 80%;
  margin: 10%;
  cursor: pointer;
  &:hover {
    border-color: #ccc;
  }
`);

const cssFlatPart = styled('div', `
  width: 80%;
  position: relative;
`);

const cssRuler = styled('div', `
  position: relative;
  border-bottom: 3px solid orange;
  z-index: 2;
`);

const cssMark = styled('div', `
  position: absolute;
  display: inline-flex;
  flex-direction: column;
  align-items: right;
`);

const cssMarkCircle = styled(cssMark, `
  top: -3px;
  height: 50%;
  right: 50%;
  transform-origin: 100% calc(100% + 3px);
  pointer-events: none;
`);

const cssTick = styled('div', `
  height: 10px;
  border-right: 1px solid black;
  margin-bottom: 2px;
  &-short {
    height: 5px;
  }
`);

const cssFrac = styled('div', `
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin-right: -100%;
  text-shadow: white 1px 1px 1px, white -1px -1px 1px;
  &-lower1 {
    margin-top: 36px;
  }
  &-lower2 {
    margin-top: 50px;
  }
`);

const cssFracPart = styled('div', `
  padding: 3px 3px 0 3px;
  font-size: 14px;
  &:nth-child(2) {
    border-top: 1px solid black;
  }
`);

dom.update(document.body, buildPage());

