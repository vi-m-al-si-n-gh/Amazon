import { cart } from '../../data/cart.js';
import { products } from '../../data/products.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { WindowUtils } from '../../utils/WindowUtils.js';
import { ComponentV2 } from '../ComponentV2.js';

export class ProductsGrid extends ComponentV2 {
    events = {
        'click .js-add-to-cart-button':
            (event) => this.#addToCart(event),
        'click .js-variation-option':
            (event) => this.#selectVariation(event)
    };

    #amazonHeader;
    #successMessageTimeouts = {};

    setAmazonHeader(amazonHeader) {
        this.#amazonHeader = amazonHeader;
    }

    render() {
        const searchParams = new URLSearchParams(WindowUtils.getSearch());
        const searchText = searchParams.get('search') || '';
        const searchResults = products.search(searchText);

        if (searchResults.length === 0) {
            this.element.innerHTML = `
        <div class="empty-results-message"
          data-testid="empty-results-message">
          No products matched your search.
        </div>
      `;
            return;
        }

        let productsGridHTML = '';

        searchResults.forEach(product => {
            const productImage = product.createImageUrl();
            const ratingStarsImage = product.createRatingStarsUrl();

            productsGridHTML += `
        <div class="js-product-container product-container" data-product-id="${product.id}"
          data-testid="product-container-${product.id}">
          <div class="product-image-container">
            <img class="js-product-image product-image" src="${productImage}"
              data-testid="product-image">
          </div>

          <div class="product-name limit-to-2-lines">
            ${product.name}
          </div>

          <div class="product-rating-container">
            <img class="product-rating-stars" src="${ratingStarsImage}">
            <div class="product-rating-count link-primary">
              ${product.ratingCount}
            </div>
          </div>

          <div class="product-price">
            ${MoneyUtils.formatMoney(product.priceCents)}
          </div>

          <div class="product-quantity-container">
            <select class="js-quantity-selector"
              data-testid="quantity-selector">
              <option selected value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </div>

          ${this.#createVariationsSelectorHTML(product)}

          <div class="product-spacer"></div>

          <div class="js-added-to-cart-message added-to-cart-message"
            data-testid="added-to-cart-message">
            <img src="images/icons/checkmark.png">
            Added
          </div>

          <button class="js-add-to-cart-button
            add-to-cart-button button-primary"
            data-testid="add-to-cart-button">
            Add to Cart
          </button>
        </div>
      `;
        });

        this.element.innerHTML = productsGridHTML;
    }

    #createVariationsSelectorHTML(product) {
        if (!product.variations) {
            return '';
        }

        let variationsHTML = '';

        Object.keys(product.variations).forEach(name => {
            variationsHTML += `
        <div class="variation-name">
          ${name}
        </div>

        <div class="js-variation-options-container variation-options-container">
          ${this.#createVariationOptionsHTML(name, product.variations[name])}
        </div>
      `;
        });

        return variationsHTML;
    }

    #createVariationOptionsHTML(variationName, variationOptions) {
        let optionsHTML = '';

        variationOptions.forEach((option, index) => {
            // On initial load, the first option is selected by default.
            optionsHTML += `
        <button class="js-variation-option variation-option
          ${index === 0 ? 'js-selected-variation is-selected' : ''}"
          data-variation-name="${variationName}"
          data-variation-value="${option}"
          data-testid="variation-${variationName}-${option}">
          ${option}
        </button>
      `;
        });

        return optionsHTML;
    }

    #addToCart(event) {
        // Add product to cart.
        const productContainer = event.currentTarget.closest('.js-product-container');
        const productId = productContainer.getAttribute('data-product-id');

        const quantitySelector = productContainer.querySelector('.js-quantity-selector');
        const quantity = quantitySelector.value;
        const variation = this.#getSelectedVariation(productContainer);

        cart.addProduct(productId, quantity, variation);

        // Update the cart count in the header.
        this.#amazonHeader?.updateCartCount();

        // Show the success message.
        const successMessageElement = productContainer.querySelector('.js-added-to-cart-message');
        successMessageElement.classList.add('is-visible');

        // Clear any previous timeouts.
        const previousTimeoutId = this.#successMessageTimeouts[productId];
        if (previousTimeoutId) {
            clearTimeout(previousTimeoutId);
        }

        // Set a timeout to clear the success message.
        const timeoutId = setTimeout(() => {
            successMessageElement.classList.remove('is-visible');
        }, 2000);

        this.#successMessageTimeouts[productId] = timeoutId;
    }

    #selectVariation(event) {
        const button = event.currentTarget;
        const variationsContainer = button.closest('.js-variation-options-container');

        // Switch the selected variation.
        const previousButton = variationsContainer.querySelector('.js-selected-variation');
        previousButton.classList.remove('js-selected-variation', 'is-selected');
        button.classList.add('js-selected-variation', 'is-selected');

        // Update the product image based on the variation selected.
        const productContainer = button.closest('.js-product-container');
        const productId = productContainer.getAttribute('data-product-id');

        const product = products.findById(productId);
        const variation = this.#getSelectedVariation(productContainer);
        const productImage = product.createImageUrl(variation);

        productContainer.querySelector('.js-product-image').src = productImage;
    }

    #getSelectedVariation(productContainer) {
        if (!productContainer.querySelector('.js-selected-variation')) {
            return;
        }

        const selectedVariation = {};

        productContainer.querySelectorAll('.js-selected-variation').forEach(button => {
            const name = button.getAttribute('data-variation-name');
            const value = button.getAttribute('data-variation-value');

            selectedVariation[name] = value;
        });

        return selectedVariation;
    }
}
