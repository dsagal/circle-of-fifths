import {Computed, dom, DomElementArg, DomContents, MultiHolder, Observable, styled} from 'grainjs';

interface Mark {
  value: number;
  label: DomContents;
}


// If the string is stretched so that the left-most number is t, then:
// - the circle has wrapped integral (1 -> t) of L/x, i.e. L*ln(t).
// - let circleFactor r = R / L (e.g. 0.25)
// - with radius R, that's angle = ln(t) / r radians.
// - therefore stretch t is Math.exp(angle * r)
// - mark m is at angle ln(m) / r radians.
// - for music, want ln(1/2)/r = 2pi => r=ln(1/2)/2pi=ln2/2pi = R/L.
//   R+L = 100% => R=100%/(1+1/r)=100%/(1+2pi/ln2)

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

const settings = [
  {factor: 10, levelStep: 25},
  {factor: 2, levelStep: 3},
];
const {factor, levelStep} = settings[0];

const circleFactor = Math.log(factor) / (2*Math.PI);
const circleRadiusPercent = 100 / (1 + 1 / circleFactor);

function buildMarks(owner: MultiHolder, stretch: Observable<number>): Observable<Mark[]> {
  const densityLevel = Computed.create(owner, stretch,
    (use, s) => Math.floor(Math.log(levelStep * s) / Math.log(factor)));
  return Computed.create<Mark[]>(owner, use => _buildMarks(use(densityLevel)));
}

function _buildMarks(densityLevel: number): Mark[] {
  const marks: Mark[] = [];
  const N = 100;
  let start = 0;
  for (let d = densityLevel; d >= densityLevel - 2; d--) {
    const maxTick = Math.pow(factor, 1 - d);
    const denom = Math.pow(10, d);
    const denomStr = denom >= 1e10 ? denom.toExponential() : denom.toString();
    const count = (d === densityLevel ? N : N - (N / factor));
    for (let i = 0; i < count; i++) {
      const value = start + maxTick * i / N;
      const label = i % 10 !== 0 ? null :
        frac(Math.round(value * denom), (denom === 1 || value === 0) ? undefined : denomStr);
      marks.push({value, label});
    }
    start = maxTick;
  }
  return marks;
}

function buildPage() {
  history.scrollRestoration = 'manual';
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
  const marksBuilder = buildMarks.bind(null, owner, stretch);

  return [
    cssScrollOuter(
      cssScrollInner(),
      dom.on('scroll', (ev, elem) => {
        angle.set(-elem.scrollTop / (elem.offsetWidth * circleRadiusPercent / 100));
      }),
    ),
    cssLogCircle(
      cssCirclePart(
        cssCircleMessage('Scroll down to turn',
          dom.style('opacity', (use) => String(Math.max(0, 1 + use(angle) / Math.PI * 2))),
        ),
        dom.style('transform', (use) => `rotate(${use(angle)}rad)`),
        cssCircleCenter(),
        dom.forEach(marksBuilder(), ({label, value}) =>
          cssMarkCircle(cssTick(cssTick.cls('-short', !label)), label,
            dom.show((use) => {
              const k = value * use(stretch);
              return k >= 1 && k < factor && value <= 1;
            }),
            (elem) => showCircleMark(elem, value),
          )
        )
      ),
      cssFlatPart(
        cssRuler(
          dom.forEach(marksBuilder(), ({label, value}) =>
            cssMark(cssTick(cssTick.cls('-short', !label)), label,
              dom.show((use) => value * use(stretch) < 1),
              dom.style('right', (use) => (value * use(stretch) * 100) + '%')
            ),
          )
        )
      )
    )
  ];
}

function showCircleMark(elem: HTMLElement, value: number) {
  const angle = -Math.log(value) / circleFactor;
  elem.style.transform = `rotate(${angle}rad)`;
}

function fracFontSize(value: number|string) {
  return cssFracPart.cls('-sz' + Math.min(10, String(value).length));
}

export function frac(numer: number|string, denom?: number|string, ...args: DomElementArg[]) {
  return cssFrac(cssFracPart('' + numer, denom ? fracFontSize(denom) : null),
    denom ? cssFracPart('' + denom, fracFontSize(denom)) : null,
    ...args);
}

const cssPage = styled('div', `
  box-sizing: border-box;
  overflow: hidden;
  font-family: sans-serif;
  position: relative;
  height: 100vh;
  width: 100vw;
  padding: 40px;
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
  position: relative;
`);

const cssScrollOuter = styled('div', `
  position: absolute;
  z-index: 10;
  overflow: scroll;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
`);

const cssScrollInner = styled('div', `
  width: 100%;
  height: 10000%;
`);

const cssCircleMessage = styled('div', `
  position: absolute;
  left: 0px;
  top: 40%;
  width: 100%;
  text-align: center;
  color: #ccc;
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

const cssCircleCenter = styled('div', `
  position: absolute;
  top: 25%;
  left: 25%;
  border: 6px dotted #00ca00;
  border-radius: 100%;
  width: 50%;
  height: 50%;
`);

const cssFlatPart = styled('div', `
  flex: auto;
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
  &-sz3 { font-size: 12px; }
  &-sz4 { font-size: 11px; }
  &-sz5 { font-size: 10px; }
  &-sz6, &-sz7, &-sz8, &-sz9, &-sz10 { font-size: 9px; }
`);

dom.update(document.body,
  {style: 'margin: 0; padding: 0'},
  buildPage());

