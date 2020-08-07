"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grainjs_1 = require("grainjs");
const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const scalePattern = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
// const log2_3 = 1 - Math.log2(3);
function buildCircle(content, scale = .8) {
    return cssCircle(content.map((elem, i) => {
        const angle = Math.PI * 2 * i / content.length;
        // const angle = (log2_3 * i - Math.floor(log2_3 * i)) * 2 * Math.PI;
        return grainjs_1.dom.update(content[i], grainjs_1.dom.style('top', (1 - Math.cos(angle) * scale) * 50 + '%'), grainjs_1.dom.style('left', (1 + Math.sin(angle) * scale) * 50 + '%'));
    }));
}
function buildPage() {
    const anglePlain = grainjs_1.Observable.create(null, 0);
    const angleFifths = grainjs_1.Observable.create(null, 0);
    function setAnglePlain(val) {
        anglePlain.set(val);
        angleFifths.set(findCloseCopy(val * 7, angleFifths.get()));
    }
    function setAngleFifths(val) {
        angleFifths.set(val);
        anglePlain.set(findCloseCopy(val * 7, anglePlain.get()));
    }
    function nfifths(i) {
        return (i * 7) % 12;
    }
    return cssPage(cssSection(cssSectionTitle("Half-Tones in Order"), cssWidget(buildCircle(notes.map((n, i) => cssNote(n))), grainjs_1.dom.update(buildCircle(scalePattern.map((inc, i) => cssHole(cssHole.cls('-close', !inc), cssHole.cls('-major-start', i == 0), cssHole.cls('-minor-start', i == 9)))), cssOverlay.cls(''), cssCenter(), grainjs_1.dom.style('transform', (use) => `rotate(${use(anglePlain)}rad)`), grainjs_1.dom.on('mousedown', (ev, elem) => rotate(ev, elem, anglePlain, setAnglePlain))))), cssSection(cssSectionTitle("Circle of Fifths"), cssWidget(buildCircle(notes.map((n, i) => cssNote(notes[nfifths(i)]))), grainjs_1.dom.update(buildCircle(scalePattern.map((inc, i) => {
        const idx = nfifths(i);
        return cssHole(cssHole.cls('-close', !scalePattern[idx]), cssHole.cls('-major-start', idx == 0), cssHole.cls('-minor-start', idx == 9));
    })), cssOverlay.cls(''), cssCenter(), grainjs_1.dom.style('transform', (use) => `rotate(${use(angleFifths)}rad)`), grainjs_1.dom.on('mousedown', (ev, elem) => rotate(ev, elem, angleFifths, setAngleFifths))))), cssLegend(cssLegendLine(cssHole(cssHole.cls('-major-start'), cssHole.cls('-legend')), grainjs_1.dom('div', 'First note of the Major scale')), cssLegendLine(cssHole(cssHole.cls('-minor-start'), cssHole.cls('-legend')), grainjs_1.dom('div', 'First note of the Minor scale'))));
}
function rotate(startEv, elem, angle, setAngle) {
    const rect = elem.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(startEv.clientY - centerY, startEv.clientX - centerX);
    if (isNaN(startAngle)) {
        return;
    }
    const angleOffset = angle.get() - startAngle;
    const upLis = grainjs_1.dom.onElem(document, 'mouseup', stop, { useCapture: true });
    const moveLis = grainjs_1.dom.onElem(document, 'mousemove', onMove, { useCapture: true });
    let isClick = true;
    startEv.preventDefault();
    function stop(stopEv) {
        moveLis.dispose();
        upLis.dispose();
        onStop(stopEv);
    }
    function onMove(moveEv) {
        isClick = false;
        let newAngle = Math.atan2(moveEv.clientY - centerY, moveEv.clientX - centerX);
        if (isNaN(newAngle)) {
            return;
        }
        // Add turns to minimize the rotation amount, so that transition is smooth.
        angle.set(findCloseCopy(angleOffset + newAngle, angle.get()));
    }
    function onStop(stopEv) {
        const factor = 2 * Math.PI / 12;
        if (isClick) {
            setAngle(findCloseCopy(Math.PI / 2 + Math.round(startAngle / factor) * factor, angle.get()));
        }
        else {
            // Align to nearest circle.
            setAngle(Math.round(angle.get() / factor) * factor);
        }
    }
}
// Add full turns to an angle to make it as close to refAngle as possible.
function findCloseCopy(angle, refAngle) {
    return angle + Math.round((refAngle - angle) / (2 * Math.PI)) * 2 * Math.PI;
}
const cssPage = grainjs_1.styled('div', `
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
const cssSection = grainjs_1.styled('div', `
  margin-right: 40px;
`);
const cssSectionTitle = grainjs_1.styled('div', `
  margin: 20px;
  text-align: center;
  font-size: larger;
`);
const cssWidget = grainjs_1.styled('div', `
  position: relative;
`);
const cssCircle = grainjs_1.styled('div', `
  position: relative;
  width: 360px;
  height: 360px;
  border-radius: 360px;
  border: 1px solid lightgrey;
`);
const cssNote = grainjs_1.styled('div', `
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
const cssOverlay = grainjs_1.styled('div', `
  position: absolute;
  top: 0px;
  left: 0px;
  border-radius: 100%;
  box-shadow: inset 0 0 0 12px var(--overlay-color);
  overflow: hidden;
  opacity: 0.8;
  transition: transform 0.15s;
  cursor: grab;
`);
const cssCenter = grainjs_1.styled('div', `
  position: absolute;
  top: calc(180px - 110px);
  left: calc(180px - 110px);
  width: 220px;
  height: 220px;
  border-radius: 100%;
  background-color: var(--overlay-color);
`);
const cssHole = grainjs_1.styled('div', `
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
const cssLegend = grainjs_1.styled('div', `
  margin: 40px;
`);
const cssLegendLine = grainjs_1.styled('div', `
  padding: 8px;
  display: flex;
  align-items: center;
`);
grainjs_1.dom.update(document.body, buildPage());
//# sourceMappingURL=index.js.map