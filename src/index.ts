import {dom, Observable, styled} from 'grainjs';

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const scalePattern = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];

function buildCircle(content: HTMLElement[], scale=.8) {
  return cssCircle(content.map((elem, i) => {
    const angle = Math.PI * 2 * i / content.length;
    return dom.update(content[i],
      dom.style('top', (1 - Math.cos(angle) * scale) * 50 + '%'),
      dom.style('left',  (1 + Math.sin(angle) * scale) * 50 + '%'),
    );
  }));
}

function buildPage() {
  const angle = Observable.create(null, 0);
  return cssPage(
    buildCircle(notes.map((n) => cssNote(n))),
    dom.update(
      buildCircle(scalePattern.map((inc, i) =>
        cssHole(cssHole.cls('-close', !inc),
          cssHole.cls('-major-start', i == 0),
          cssHole.cls('-minor-start', i == 9),
        )
      )),
      cssOverlay.cls(''),
      cssCenter(),
      dom.style('transform', (use) => `rotate(${use(angle)}rad)`),
      dom.on('mousedown', (ev, elem) => rotate(ev, elem as HTMLElement, angle)),
    ),
    cssLegend(
      cssLegendLine(cssHole(cssHole.cls('-major-start'), cssHole.cls('-legend')),
        dom('div', 'First note of the Major scale')),
      cssLegendLine(cssHole(cssHole.cls('-minor-start'), cssHole.cls('-legend')),
        dom('div', 'First note of the Minor scale')),
    )
  );
}

function rotate(startEv: MouseEvent, elem: HTMLElement, angle: Observable<number>) {
  const rect = elem.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const startAngle = Math.atan2(startEv.clientY - centerY, startEv.clientX - centerX);
  if (isNaN(startAngle)) { return; }
  const angleOffset = angle.get() - startAngle;

  const upLis = dom.onElem(document, 'mouseup', stop, {useCapture: true});
  const moveLis = dom.onElem(document, 'mousemove', onMove, {useCapture: true});
  startEv.preventDefault();
  function stop(stopEv: MouseEvent) {
    moveLis.dispose();
    upLis.dispose();
    onStop(stopEv);
  }
  function onMove(moveEv: MouseEvent) {
    const newAngle = Math.atan2(moveEv.clientY - centerY, moveEv.clientX - centerX);
    if (isNaN(newAngle)) { return; }
    angle.set(angleOffset + newAngle);
  }
  function onStop(stopEv: MouseEvent) {
    // Align circles.
    elem.style.transition = 'transform 0.1s';
    angle.set(Math.round(angle.get() / (2*Math.PI) * 12) / 12 * 2 * Math.PI);
    setTimeout(() => { elem.style.transition = 'none'; }, 100);
  }
}



const cssPage = styled('div', `
  box-sizing: border-box;
  font-family: sans-serif;
  position: relative;
  margin: 100px;
  --overlay-color: rgba(230, 200, 250);
  display: flex;
  align-items: top;

  *, *:before, *:after {
  -webkit-box-sizing: border-box;
     -moz-box-sizing: border-box;
          box-sizing: border-box;
  }
`);

const cssCircle = styled('div', `
  position: relative;
  width: 360px;
  height: 360px;
  border-radius: 360px;
  border: 1px solid lightgrey;
`);

const cssNote = styled('div', `
  position: absolute;
  border-radius: 48px;
  border: 1px solid grey;
  width: 48px;
  height: 48px;
  margin-left: -24px;
  margin-top: -24px;
  display: flex;
  align-items: center;
  justify-content: center;
`);

const cssOverlay = styled('div', `
  position: absolute;
  top: 0px;
  left: 0px;
  border-radius: 100%;
  box-shadow: inset 0 0 0 12px var(--overlay-color);
  overflow: hidden;
  opacity: 0.8;
  &:hover {
    cursor: grab;
  }
`);

const cssCenter = styled('div', `
  position: absolute;
  top: calc(180px - 110px);
  left: calc(180px - 110px);
  width: 220px;
  height: 220px;
  border-radius: 100%;
  background-color: var(--overlay-color);
`);

const cssHole = styled('div', `
  position: absolute;
  border-radius: 48px;
  border: 1px solid grey;
  width: 48px;
  height: 48px;
  margin-left: -24px;
  margin-top: -24px;
  box-shadow: 0 0 0 24px var(--overlay-color);
  &-close {
    background-color: var(--overlay-color);
  }
  &-major-start {
    border: 3px solid red;
  }
  &-minor-start {
    border: 3px solid blue;
  }
  &-legend {
    position: relative;
    margin: 0 16px 0 0;
    box-shadow: none;
  }
`);

const cssLegend = styled('div', `
`);

const cssLegendLine = styled('div', `
  padding: 8px;
  margin-left: 80px;
  display: flex;
  align-items: center;
`);

dom.update(document.body, buildPage());
