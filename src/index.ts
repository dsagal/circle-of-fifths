import {dom, styled} from 'grainjs';

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
  return cssPage(
    buildCircle(notes.map((n) => cssNote(n))),
    dom.update(buildCircle(scalePattern.map((inc) => cssHole(cssHole.cls('-close', !inc)))),
      cssOverlay.cls(''),
      cssCenter(),
    )
  );
}

const cssPage = styled('div', `
  box-sizing: border-box;
  font-family: sans-serif;
  position: relative;
  margin: 100px;
  --overlay-color: rgba(230, 200, 250);

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
  transform: rotate(3deg);
  opacity: 0.8;
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
`);

dom.update(document.body, buildPage());
