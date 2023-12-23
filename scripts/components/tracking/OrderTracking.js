import { orders } from '../../data/orders.js';
import { products } from '../../data/products.js';
import { DateUtils } from '../../utils/DateUtils.js';
import { WindowUtils } from '../../utils/WindowUtils.js';
import { ComponentV2 } from '../ComponentV2.js';
import { VariationUtils } from '../../utils/VariationUtils.js';

export class OrderTracking extends ComponentV2 {
    render() {
        const urlSearchParams = new URLSearchParams(WindowUtils.getSearch());
        const orderId = urlSearchParams.get('orderId');
        const cartItemId = urlSearchParams.get('cartItemId');

        const order = orders.findById(orderId);
        if (!order) {
            this.#renderNotFoundMessage();
            return;
        }

        const productDetails = order.findProductDetails(cartItemId);
        if (!productDetails) {
            this.#renderNotFoundMessage();
            return;
        }

        const estimatedDeliveryTimeMs = productDetails.estimatedDeliveryTimeMs;
        const deliveryDateMessage = Date.now() < estimatedDeliveryTimeMs
            ? `Arriving on ${DateUtils.formatDateWeekday(estimatedDeliveryTimeMs)}`
            : `Delivered on ${DateUtils.formatDateWeekday(estimatedDeliveryTimeMs)}`;

        const product = products.findById(productDetails.productId);
        const productImage = product.createImageUrl(productDetails.variation);

        const progressPercent = this.#getProgressPercent(productDetails, order);
        const status = this.#getDeliveryStatus(progressPercent);

        this.element.innerHTML = `
      <a class="back-to-orders-link link-primary" href="orders.html">
        View all orders
      </a>

      <div class="delivery-date" data-testid="delivery-date-message">
        ${deliveryDateMessage}
      </div>

      <div class="product-info" data-testid="product-name">
        ${product.name}
      </div>

      ${VariationUtils.createVariationInfoHTML(productDetails.variation)}

      <div class="product-info">
        Quantity: ${productDetails.quantity}
      </div>

      <img class="product-image" src="${productImage}">

      <div class="progress-labels-container">
        <div class="progress-label
          ${status === 'Preparing' ? 'current-status-label' : ''}"
          ${status === 'Preparing' ? 'data-testid="current-status"' : ''}>
          Preparing
        </div>
        <div class="progress-label
          ${status === 'Shipped' ? 'current-status-label' : ''}"
          ${status === 'Shipped' ? 'data-testid="current-status"' : ''}>
          Shipped
        </div>
        <div class="progress-label
          ${status === 'Delivered' ? 'current-status-label' : ''}"
          ${status === 'Delivered' ? 'data-testid="current-status"' : ''}>
          Delivered
        </div>
      </div>

      <div class="progress-bar-container">
        <div class="js-progress-bar progress-bar"
          data-testid="progress-bar"></div>
      </div>
    `;

        setTimeout(() => {
            this.element.querySelector('.js-progress-bar')
                .style.width = `${progressPercent}%`;
        }, 300);
    }

    #renderNotFoundMessage() {
        this.element.innerHTML = `
      <div data-testid="not-found-message">
        Tracking information not found.
      </div>
    `;
    }

    #getProgressPercent(productDetails, order) {
        const totalShippingTime = productDetails.estimatedDeliveryTimeMs - order.orderTimeMs;
        const timeSinceOrdered = Date.now() - order.orderTimeMs;

        let progressPercent = timeSinceOrdered / totalShippingTime * 100;

        if (progressPercent <= 5) {
            progressPercent = 5;
        } else if (progressPercent >= 100) {
            progressPercent = 100;
        }

        return Math.ceil(progressPercent);
    }

    #getDeliveryStatus(progressPercent) {
        if (progressPercent === 100) {
            return 'Delivered';
        } else if (progressPercent > 50) {
            return 'Shipped';
        } else {
            return 'Preparing';
        }
    }
}
