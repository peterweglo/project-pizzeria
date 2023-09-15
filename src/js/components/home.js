import { templates, select } from '../settings.js';

class Home {
  constructor(element) {
    const thisHome = this;
    thisHome.render(element);
  }

  render(element) {
    const thisHome = this;
    const generatedHtml = templates.homeWidget();
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHtml;
  }
}

export default Home;
