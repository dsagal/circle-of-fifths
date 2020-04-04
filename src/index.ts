import {dom, styled} from 'grainjs';

function buildPage() {
  return cssPage('Hello world!');
}

const cssPage = styled('div', `
  box-sizing: border-box;
  font-family: sans-serif;
  margin: 100px;
`);

dom.update(document.body, buildPage());
