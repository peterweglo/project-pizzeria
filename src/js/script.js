/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  ('use strict');

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice:
        '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },

    cart: {
      defaultDeliveryFee: 20,
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(
      document.querySelector(select.templateOf.menuProduct).innerHTML
    ),

    cartProduct: Handlebars.compile(
      document.querySelector(select.templateOf.cartProduct).innerHTML
    ),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      thisProduct.prepareCartProductParams();
    }
    renderInMenu() {
      const thisProduct = this;

      /*generate HTML based on template */

      const generatedHtml = templates.menuProduct(thisProduct.data);

      /* create element using utils.createElementFromHTML */

      thisProduct.element = utils.createDOMFromHTML(generatedHtml);

      /* find menu container */

      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */

      menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
      const thisProduct = this;
      thisProduct.dom = {};

      thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(
        select.menuProduct.clickable
      );
      thisProduct.dom.form = thisProduct.element.querySelector(
        select.menuProduct.form
      );
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(
        select.all.formInputs
      );
      thisProduct.dom.cartButton = thisProduct.element.querySelector(
        select.menuProduct.cartButton
      );
      thisProduct.dom.priceElem = thisProduct.element.querySelector(
        select.menuProduct.priceElem
      );
      thisProduct.dom.imageWraper = thisProduct.element.querySelector(
        select.menuProduct.imageWrapper
      );
      thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(
        select.menuProduct.amountWidget
      );
    }

    initAccordion() {
      const thisProduct = this;

      // /* find the clickable trigger (the element that should react to clicking) */
      // const clickableTrigger = thisProduct.element.querySelector(
      //   select.menuProduct.clickable
      // );

      /* START: add event listener to clickable trigger on event click */
      thisProduct.dom.accordionTrigger.addEventListener(
        'click',
        function (event) {
          /* prevent default action for event */
          event.preventDefault();
          /* find active product (product that has active class) */
          const activeProduct = document.querySelector(
            select.all.menuProductsActive
          );
          /* if there is active product and it's not thisProduct.element, remove class active from it */
          if (activeProduct && activeProduct !== thisProduct.element) {
            activeProduct.classList.remove(
              classNames.menuProduct.wrapperActive
            );
          }
          /* toggle active class on thisProduct.element */
          thisProduct.element.classList.toggle(
            classNames.menuProduct.wrapperActive
          );
        }
      );
    }
    initOrderForm() {
      const thisProduct = this;

      thisProduct.dom.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });
      for (let input of thisProduct.dom.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }
      thisProduct.dom.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }
    processOrder() {
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      // console.log('formData', formData);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];

        // for every option in this category
        for (let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];

          if (formData[paramId] && formData[paramId].includes(optionId)) {
            if (option.default !== true) {
              price += option.price;
            }
          } else {
            if (option.default == true) {
              price -= option.price;
            }
          }

          const image = thisProduct.dom.imageWraper.querySelector(
            '.' + paramId + '-' + optionId
          );

          if (image) {
            if (formData[paramId] && formData[paramId].includes(optionId)) {
              image.classList.add(classNames.menuProduct.imageVisible);
            } else {
              image.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }

      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      thisProduct.dom.priceElem.innerHTML = price;
    }
    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(
        thisProduct.dom.amountWidgetElem
      );
      thisProduct.dom.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }
    prepareCartProduct() {
      const thisProduct = this;
      const productSummary = {};
      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = productSummary.priceSingle * productSummary.amount;
      productSummary.params = thisProduct.prepareCartProductParams();
      return productSummary;
    }
    addToCart() {
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct());
    }
    prepareCartProductParams() {
      const thisProduct = this;
      const productParams = {};

      const formData = utils.serializeFormToObject(thisProduct.dom.form);

      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        // paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        productParams[paramId] = {
          label: param.label,
          options: {},
        };

        for (let optionId in param.options) {
          const option = param.options[optionId];
          // optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          if (formData[paramId] && formData[paramId].includes(optionId)) {
            productParams[paramId].options[optionId] = option.label;
          }
        }
      }
      // console.log('productParams', productParams);
      return productParams;
    }
  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }
    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(
        select.widgets.amount.input
      );
      thisWidget.linkDecrease = thisWidget.element.querySelector(
        select.widgets.amount.linkDecrease
      );
      thisWidget.linkIncrease = thisWidget.element.querySelector(
        select.widgets.amount.linkIncrease
      );
    }
    setValue(value) {
      const thisWidget = this;

      const newValue = parseInt(value);

      if (
        newValue !== thisWidget.value &&
        !isNaN(newValue) &&
        newValue <= settings.amountWidget.defaultMax &&
        newValue >= settings.amountWidget.defaultMin
      ) {
        thisWidget.value = newValue;
        thisWidget.announce();
      }
      thisWidget.input.value = thisWidget.value;
    }
    initActions() {
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    announce() {
      const thisWidget = this;
      // const event = new Event('updated');
      const event = new CustomEvent('updated', {
        bubbles: true,
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

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
      thisCart.dom.totalPrice = element.querySelectorAll(
        select.cart.totalPrice
      );
      thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
    }
    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function () {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function () {
        console.log('thisCart.dom.productList ', thisCart.dom.productList);
        thisCart.update();
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
      let deliveryFee = settings.cart.defaultDeliveryFee;
      let totalNumber = 0;
      let subtotalPrice = 0;
      for (let product of thisCart.products) {
        totalNumber += product.amount;
        subtotalPrice += product.price;
      }
      if (totalNumber) {
        thisCart.totalPrice = subtotalPrice + deliveryFee;
      } else {
        deliveryFee = 0;
        thisCart.totalPrice = 0;
      }
      console.log(
        'totalNumber',
        totalNumber,
        'subtotalPrice',
        subtotalPrice,
        'thisCart.totalPrice',
        thisCart.totalPrice,
        'deliveryFee',
        deliveryFee,
        thisCart.dom.totalPrice
      );
      thisCart.dom.deliveryFee.textContent = deliveryFee;
      thisCart.dom.subtotalPrice.textContent = subtotalPrice;
      thisCart.dom.totalNumber.textContent = totalNumber;

      for (let totalPriceElement of thisCart.dom.totalPrice) {
        totalPriceElement.textContent = thisCart.totalPrice;
      }
    }
  }

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      // console.log('thisCartProduct', thisCartProduct);
    }
    getElements(element) {
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = element.querySelector(
        select.cartProduct.amountWidget
      );
      thisCartProduct.dom.price = element.querySelector(
        select.cartProduct.price
      );
      thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = element.querySelector(
        select.cartProduct.remove
      );
    }
    initAmountWidget() {
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(
        thisCartProduct.dom.amountWidget
      );
      thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
        // thisCartProduct.dom.price.textContent =
        //   thisCartProduct.amountWidget.value * thisCartProduct.priceSingle;
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price =
          thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.textContent = thisCartProduct.price;
      });
    }
  }
  const app = {
    initMenu: function () {
      const thisApp = this;

      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },
    initData: function () {
      const thisApp = this;

      thisApp.data = dataSource;
    },

    initCart: function () {
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function () {
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);
      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
}
