import { cart } from '../../data/cart.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { orders } from '../../data/orders.js';
import { Component } from '../Component.js';
import { PayPalButtons } from './PayPalButtons.js';
import { WindowUtils } from '../../utils/WindowUtils.js';

export class PaymentSummary extends Component {
    element;
    events = {
        'click .js-paypal-toggle':
            (event) => this.#togglePaypal(event)
    };

    #usePaypal;
    #loadedPaypal = false;

    constructor(selector) {
        super();
        this.element = document.querySelector(selector);
        this.#usePaypal = localStorage.getItem('exercises-amazon-use-paypal') === 'true';
    }

    render() {
        this.element.innerHTML = `
      <div class="js-payment-info"></div>

      <div class="paypal-toggle">
        Use PayPal <input type="checkbox" class="js-paypal-toggle"
          ${this.#usePaypal && 'checked'}>
      </div>

      <div class="js-payment-buttons-container ${this.#usePaypal && 'use-paypal'}"
        data-testid="payment-buttons-container">

        <div class="js-paypal-button-container paypal-button-container"
          data-testid="paypal-button-container"></div>

        <button class="js-place-order-button place-order-button button-primary"
          data-testid="place-order-button">
          Place your order
        </button>
      </div>
    `;

        this.refreshPaymentDetails();

        if (this.#usePaypal && !this.#loadedPaypal) {
            new PayPalButtons('.js-paypal-button-container').create();
            this.#loadedPaypal = true;
        }

        this.events['click .js-place-order-button'] =
            (event) => this.#performCheckout(event);
    }

    refreshPaymentDetails() {
        const {
            productCostCents,
            shippingCostCents,
            taxCents,
            totalCents
        } = cart.calculateCosts();

        this.element.querySelector('.js-payment-info').innerHTML = `
      <div class="payment-summary-title">
        Order Summary
      </div>

      <div class="payment-summary-row">
        <div>Items (${cart.calculateTotalQuantity()}):</div>
        <div class="payment-summary-money"
          data-testid="product-cost">
          ${MoneyUtils.formatMoney(productCostCents)}
        </div>
      </div>

      <div class="payment-summary-row">
        <div>Shipping & handling:</div>
        <div class="payment-summary-money"
          data-testid="shipping-cost">
          ${MoneyUtils.formatMoney(shippingCostCents)}
        </div>
      </div>

      <div class="payment-summary-row subtotal-row">
        <div>Total before tax:</div>
        <div class="payment-summary-money"
          data-testid="sub-total">
          ${MoneyUtils.formatMoney(productCostCents + shippingCostCents)}
        </div>
      </div>

      <div class="payment-summary-row">
        <div>Estimated tax (${MoneyUtils.taxRate * 100}%):</div>
        <div class="payment-summary-money"
          data-testid="tax-cost">
          ${MoneyUtils.formatMoney(taxCents)}
        </div>
      </div>

      <div class="payment-summary-row total-row">
        <div>Order total:</div>
        <div class="payment-summary-money"
          data-testid="total-cost">
          ${MoneyUtils.formatMoney(totalCents)}
        </div>
      </div>
    `;

        if (cart.isEmpty()) {
            this.element.querySelector('.js-payment-buttons-container')
                .classList.add('payment-buttons-disabled');
        }
    }

    #performCheckout() {
        orders.createNewOrder(cart);
        WindowUtils.setHref('orders.html');
    }

    #togglePaypal() {
        this.#usePaypal = !this.#usePaypal;

        if (this.#usePaypal) {
            this.element.querySelector('.js-payment-buttons-container')
                .classList.add('use-paypal');

            if (!this.#loadedPaypal) {
                new PayPalButtons('.js-paypal-button-container').create();
                this.#loadedPaypal = true;
            }

        } else {
            this.element.querySelector('.js-payment-buttons-container')
                .classList.remove('use-paypal');
        }

        localStorage.setItem('exercises-amazon-use-paypal', this.#usePaypal);
    }
}
