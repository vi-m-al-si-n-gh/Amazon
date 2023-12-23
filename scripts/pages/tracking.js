import { AmazonHeader } from '../components/shared/AmazonHeader.js';
import { OrderTracking } from '../components/tracking/OrderTracking.js';
import { products } from '../data/products.js';

products.loadFromBackend().then(() => {
    new AmazonHeader('.js-amazon-header').create();
    new OrderTracking('.js-order-tracking').create();
});
