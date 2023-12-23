import { AmazonHeader } from '../components/shared/AmazonHeader.js';
import { OrdersGrid } from '../components/orders/OrdersGrid.js';
import { products } from '../data/products.js';

products.loadFromBackend().then(() => {
    const amazonHeader = new AmazonHeader('.js-amazon-header').create();
    const ordersGrid = new OrdersGrid('.js-orders-grid').create();
    ordersGrid.setAmazonHeader(amazonHeader);
});
