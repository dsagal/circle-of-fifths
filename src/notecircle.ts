import {dom, DomElementArg, DomContents, styled} from 'grainjs';
import {Computed, MultiHolder, Observable} from 'grainjs';

interface Mark {
  value: number;
  label: DomContents;
}

interface Message {
  // Start and end refer to the highest value on the ruler, i.e. 1/stretch
  start: number;
  msg: DomContents;
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

const messages: Message[] = [
  {start: 1, msg: [
    dom('p', 'Imagine that the orange line is a rubber band.'),
    dom('p', 'Scroll to turn the green wheel.')
  ]},
  {start: 0.75, msg: [
    dom('p', 'The wheel is sticky. As it turns, the rubber band sticks to it, ',
      'remaining as stretched as it was when it touched it.'),
  ]},
  {start: 0.55, msg: [
    dom('p', 'Keep scrolling.'),
  ]},
  {start: 0.40, msg: [
    dom('p', 'Notice how the new ticks on the wheel end up more spread out than the first ticks.'),
  ]},
  {start: 0.30, msg: [
    dom('p', 'Keep scrolling.'),
  ]},
  {start: 0.20, msg: [
    dom('p', 'We show more tick marks as the rubber band keeps on stretching.')
  ]},
  {start: 0.13, msg: [
    dom('p',
      'The size of the wheel is such that one full turn meets the rubber band when it ',
      'has stretched by a factor of 10.',
    ),
  ]},
  {start: 0.095, msg: [
    dom('p', 'For this, the circle\'s circumference is ',
      dom('i', 'ln(10)'), ' times the initial length of the rubber band.'),
  ]},
  {start: 0.075, msg: [
    dom('p', dom('i', 'ln(10)'), ' is the natural logarithm of 10, about 2.3, ',
      'the power to which to raise the number ', dom('i', 'e'), ' to get 10.'),
  ]},
  {start: 0.055, msg: [
    dom('p', 'This is the end of the text.'),
  ]},
  {start: 0.045, msg: [
    dom('p', 'Feel free to keep scrolling around.'),
  ]},
];


const settings = [
  {factor: 2, levelStep: 1.5},
  {factor: 2**7, levelStep: 1.5},
];

const {factor, levelStep} = settings[1];

const circleFactor = Math.log(factor) / (2*Math.PI);
const circleRadiusPercent = 100 / (1 + 1 / circleFactor);

const intervalSymbols = {
  fourth: '\u25a1',
  fifth: '\u2b20',
  octave: '\u26ab',
};

function buildMarks(owner: MultiHolder, stretch: Observable<number>): Observable<Mark[]> {
  const densityLevel = Computed.create(owner, stretch,
    (use, s) => Math.floor(Math.log(levelStep * s) / Math.log(factor)));
  return Computed.create<Mark[]>(owner, use => _buildMarks(use(densityLevel)));
}

const fifth = 2/3;
// const fourth = 3/4;


function _buildMarks(densityLevel: number): Mark[] {
  const marks: Mark[] = [];

  const f = 2**-4;
  marks.push({value: 1 * f, label: frac('D')});
  marks.push({value: fifth * f, label: frac('A')});
  marks.push({value: fifth**2 * f, label: frac('E')});
  marks.push({value: fifth**3 * f, label: frac('B')});
  marks.push({value: fifth**4 * f, label: frac('F#')});
  marks.push({value: fifth**5 * f, label: frac('C#')});
  marks.push({value: fifth**6 * f, label: frac('G#')});
  marks.push({value: fifth**7 * f, label: frac('D#')});
  /*
  marks.push({value: fourth / 2**6, label: frac('G')});
  marks.push({value: fourth**2 / 2**5, label: frac('C')});
  marks.push({value: fourth**3 / 2**4, label: frac('F')});
  marks.push({value: fourth**4 / 2**3, label: frac('Bb')});
  marks.push({value: fourth**5 / 2**2, label: frac('Eb')});
  marks.push({value: fourth**6 / 2**1, label: frac('Ab')});
  */
  marks.push({value: fifth**(-1) * f, label: frac('G')});
  marks.push({value: fifth**(-2) * f, label: frac('C')});
  marks.push({value: fifth**(-3) * f, label: frac('F')});
  marks.push({value: fifth**(-4) * f, label: frac('Bb')});
  marks.push({value: fifth**(-5) * f, label: frac('Eb')});
  marks.push({value: fifth**(-6) * f, label: frac('Ab')});
  return marks;
}

function buildPage() {
  history.scrollRestoration = 'manual';
  return [
    cssScrollInner(),
    dom.create(buildLogCircle),
  ];
}

function angleToStretch(angle: number): number {
  return Math.exp(-angle * circleFactor);
}

function stretchToAngle(stretch: number): number {
  return -Math.log(stretch) / circleFactor;
}

function scrollToAngle(): number {
  const elem = document.documentElement;
  return -elem.scrollTop / (elem.offsetWidth * circleRadiusPercent / 100);
}

function angleToScroll(angle: number): number {
  const elem = document.documentElement;
  return -angle * (elem.offsetWidth * circleRadiusPercent / 100);
}

function setMessagePosition(msg: Message) {
  const startStretch = 1 / msg.start;
  return dom.style('top', angleToScroll(stretchToAngle(startStretch)) + 'px');
}

function buildLogCircle(owner: MultiHolder) {
  const angle = Observable.create(owner, 0);
  const stretch = Computed.create(owner, angle, (use, a) => angleToStretch(a));
  const marksBuilder = buildMarks.bind(null, owner, stretch);

  dom.onElem(window, 'scroll', (ev) => angle.set(scrollToAngle()));

  return [
    cssTitle('The Wheel of Logarithms'),
    cssLogCircle(
      cssCirclePart(
        dom.style('transform', (use) => `rotate(${use(angle)}rad)`),
        cssCircleCenter(),
        cssCircumHalf1(),
        cssCircumHalf2(
          cssCircumHalf2.cls((use) => {
            const halfTurns = -use(angle) / Math.PI;
            return halfTurns < 1 ? '-start' : halfTurns < 2 ? '-middle' : '-end'
          }),
          dom.style('transform', (use) => `rotate(${-use(angle) + Math.PI / 4}rad)`),
        ),
        dom.forEach(marksBuilder(), ({label, value}) =>
          cssMarkCircle(cssTick(cssTick.cls('-short', !label)), label,
            dom.show((use) => {
              const k = value * use(stretch);
              return k >= 1 && /*k < factor &&*/ value <= 1;
            }),
            (elem) => showCircleMark(elem, value),
          )
        ),
      ),
      cssFlatPart(
        cssRuler(
          dom.forEach(marksBuilder(), ({label, value}) =>
            cssMark(cssTick(cssTick.cls('-short', !label)), label,
              dom.show((use) => value * use(stretch) < 1),
              dom.style('right', (use) => (value * use(stretch) * 100) + '%')
            ),
          )
        ),
        cssRulerAnchor(),
      ),
    ),
    cssMessages(
      cssMessagesTop(),
      cssMessagesBottom(),
      cssMessagesBody(
        dom.forEach(messages, (msg) =>
          cssMessage(setMessagePosition(msg), msg.msg)
        )
      )
    ),
  ];
}

function showCircleMark(elem: HTMLElement, value: number) {
  const angle = -Math.log(value) / circleFactor;
  elem.style.transform = `rotate(${angle}rad)`;
}

function fracFontSize(value: number|string) {
  return cssFracPart.cls('-sz' + Math.min(10, String(value).length));
}

function frac(numer: number|string, denom?: number|string, ...args: DomElementArg[]) {
  return cssFrac(cssFracPart('' + numer, denom ? fracFontSize(denom) : null),
    denom ? cssFracPart('' + denom, fracFontSize(denom)) : null,
    ...args);
}

export function interval(count: number, type: 'fourth'|'fifth'|'octave') {
  return cssFrac(cssFrac.cls('-interval'),
    intervalSymbols[type]);
}

const cssBody = styled('body', `
  box-sizing: border-box;
  font-family: sans-serif;
  padding: 0px;
  margin: 0px;
  --overlay-color: rgba(230, 200, 250);
  --wheel-color: #00ca00;
  --text-color: #6745dd;

  *, *:before, *:after {
  -webkit-box-sizing: border-box;
     -moz-box-sizing: border-box;
          box-sizing: border-box;
  }
`);

const cssTitle = styled('h1', `
  position: fixed;
  width: 100%;
  text-align: center;
  font-size: 20px;
  margin: 40px;
  color: var(--text-color);
`);

const cssLogCircle = styled('div', `
  position: fixed;
  display: flex;
  width: 60%;
  top: 60px;
  padding: 40px;
`);

const cssScrollInner = styled('div', `
  position: absolute;
  width: 1px;
  height: 2500%;
`);

const cssCirclePart = styled('div', `
  position: relative;
  border: 3px solid transparent;
  border-radius: 100%;
  box-shadow: inset 0 0 0 3px var(--wheel-color);
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
  border: 6px dashed var(--wheel-color);
  border-radius: 100%;
  width: 50%;
  height: 50%;
`);

const cssCircumference = styled('div', `
  position: absolute;
  top: -3px;
  left: -3px;
  bottom: -3px;
  right: -3px;
  border-radius: 100%;
  border: 3px solid transparent;
`);

// Together cssCirumHalfs form the appearance of the string wrapping partially around the wheel.
const cssCircumHalf1 = styled(cssCircumference, `
  border-top-color: orange;
  border-right-color: orange;
  transform: rotate(45deg);
`);

const cssCircumHalf2 = styled(cssCircumference, `
  &-start {
    border-top-color: white;
    border-right-color: white;
    /* make the white portion wider to avoid a bit of orange leaking from under it */
    top: -4px;
    left: -4px;
    bottom: -4px;
    right: -4px;
    border-width: 4px;
  }
  &-middle {
    border-left-color: orange;
    border-bottom-color: orange;
  }
  &-end {
    border-color: orange;
  }
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

const cssRulerAnchor = styled('div', `
  position: absolute;
  top: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  border-radius: 10px;
  background-color: orange;
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
  &-interval {
    position: absolute;
    top: -28px;
    font-size: 24px;
    width: 200%;
  }
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

const cssMessages = styled('div', `
  position: absolute;
  z-index: -1;
  top: 0px;
  right: 0px;
  width: ${100 - 2 * circleRadiusPercent}%;
  margin: 0 20px;
`);

const cssMessagesTop = styled('div', `
  position: fixed;
  top: 0px;
  height: 220px;
  width: 100%;
  background: linear-gradient(white, white 80%, transparent);
  z-index: 1;
`);

const cssMessagesBottom = styled(cssMessagesTop, `
  bottom: 0px;
  top: unset;
  height: calc(100% - 450px);
  background: linear-gradient(transparent, white 20%, white);
`);

const cssMessagesBody = styled('div', `
  position: relative;
  max-width: 400px;
  margin: 220px auto auto 100px;
  color: var(--text-color);
`);

const cssMessage = styled('div', `
  position: absolute;
  font-size: 18px;
  line-height: 1.5;
`);

dom.update(document.body, cssBody.cls(''), buildPage());
