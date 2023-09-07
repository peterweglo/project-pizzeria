import { settings, select, templates, classNames } from '../settings.js';
import { utils } from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;
    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
  }
  getElements(element) {
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
      select.cart.toggleTrigger
    );
    thisCart.dom.productList = element.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = element.querySelector(
      select.cart.subtotalPrice
    );
    thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
    thisCart.dom.form = element.querySelector(select.cart.form);
    thisCart.dom.adress = element.querySelector(select.cart.address);
    thisCart.dom.phone = element.querySelector(select.cart.phone);
  }
  initActions() {
    const thisCart = this;
    thisCart.dom.toggleTrigger.addEventListener('click', function () {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function () {
      thisCart.update();
    });
    thisCart.dom.productList.addEventListener('remove', function (event) {
      thisCart.remove(event.detail.cartProduct);
    });
    thisCart.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisCart.sendOrder();
    });
  }
  add(menuProduct) {
    const thisCart = this;

    const generatedHtml = templates.cartProduct(menuProduct);
    const generetedDOM = utils.createDOMFromHTML(generatedHtml);

    thisCart.dom.productList.appendChild(generetedDOM);

    // console.log('menuProduct', menuProduct);
    // thisCart.products.push(menuProduct);
    thisCart.products.push(new CartProduct(menuProduct, generetedDOM));
    console.log('new Product', thisCart.products);
    thisCart.update();
  }
  update() {
    const thisCart = this;
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;
    for (let product of thisCart.products) {
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price;
    }
    if (thisCart.totalNumber) {
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    } else {
      thisCart.deliveryFee = 0;
      thisCart.totalPrice = 0;
    }
    console.log(
      'totalNumber',
      thisCart.totalNumber,
      'subtotalPrice',
      thisCart.subtotalPrice,
      'thisCart.totalPrice',
      thisCart.totalPrice,
      'deliveryFee',
      thisCart.deliveryFee,
      thisCart.dom.totalPrice
    );
    thisCart.dom.deliveryFee.textContent = thisCart.deliveryFee;
    thisCart.dom.subtotalPrice.textContent = thisCart.subtotalPrice;
    thisCart.dom.totalNumber.textContent = thisCart.totalNumber;

    for (let totalPriceElement of thisCart.dom.totalPrice) {
      totalPriceElement.textContent = thisCart.totalPrice;
    }
  }
  remove(product) {
    const thisCart = this;
    const indexOfproduct = thisCart.products.indexOf(product);
    // console.log('const indexOfproduct', indexOfproduct);
    thisCart.products.splice(indexOfproduct, 1);
    // console.log(thisCart.products);
    thisCart.update();
    product.dom.wrapper.innerHTML = '';
  }
  sendOrder() {
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;
    const payload = {
      address: thisCart.dom.adress.value,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: thisCart.deliveryFee,
      products: [],
    };
    for (let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
      });
  }
}

export default Cart;
