import React from 'react';
import { Route, Routes } from 'react-router-dom';

import StoreLayout from './components/StoreLayout';
import AdminLayout from './components/AdminLayout';
import NotFound from './pages/NotFound/NotFound';

import Home from './pages/Home/Home';
import ProductList from './pages/ProductList/ProductList';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import PaymentResult from './pages/PaymentResult/PaymentResult';
import Profile from './pages/member/Profile/Profile';
import OrderList from './pages/member/OrderList/OrderList';
import AfterSalesList from './pages/member/AfterSalesList/AfterSalesList';
import AfterSalesDetail from './pages/member/AfterSalesDetail/AfterSalesDetail';
import AfterSalesApply from './pages/member/AfterSalesApply/AfterSalesApply';
import CouponCenter from './pages/CouponCenter/CouponCenter';
import MyCoupons from './pages/member/MyCoupons/MyCoupons';

import Dashboard from './pages/admin/Dashboard/Dashboard';
import ProductManage from './pages/admin/ProductManage/ProductManage';
import OrderManage from './pages/admin/OrderManage/OrderManage';
import MarketingManage from './pages/admin/MarketingManage/MarketingManage';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="payment/:orderId" element={<PaymentResult />} />
        <Route path="member/profile" element={<Profile />} />
        <Route path="member/orders" element={<OrderList />} />
        <Route path="member/after-sales" element={<AfterSalesList />} />
        <Route path="member/after-sales/:id" element={<AfterSalesDetail />} />
        <Route path="member/after-sales/apply/:orderId" element={<AfterSalesApply />} />
        <Route path="coupons" element={<CouponCenter />} />
        <Route path="member/coupons" element={<MyCoupons />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductManage />} />
        <Route path="orders" element={<OrderManage />} />
        <Route path="marketing" element={<MarketingManage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
