export type Language = 'zh' | 'en';

export interface TranslationDict {
  nav: {
    home: string;
    products: string;
    cart: string;
    member: string;
    categories: string;
  };
  categories: {
    baby: string;
    cosmetics: string;
    food: string;
    home: string;
    apparel: string;
  };
  search: {
    placeholder: string;
    button: string;
  };
  cart: {
    title: string;
    empty: string;
    checkout: string;
    subtotal: string;
  };
  product: {
    newArrival: string;
    hotSale: string;
    discount: string;
    originalPrice: string;
    viewDetail: string;
    addToCart: string;
  };
  common: {
    loading: string;
    error: string;
    confirm: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    submit: string;
    back: string;
    more: string;
    all: string;
  };
  footer: {
    aboutUs: string;
    aboutDesc: string;
    customerService: string;
    faq: string;
    contactUs: string;
    shippingInfo: string;
    shoppingGuide: string;
    paymentMethods: string;
    returnPolicy: string;
    membershipTerms: string;
    contact: string;
    hours: string;
    copyright: string;
  };
  admin: {
    dashboard: string;
    productManagement: string;
    orderManagement: string;
    marketingManagement: string;
    adminPanel: string;
    logout: string;
    admin: string;
  };
}

export const translations: Record<Language, TranslationDict> = {
  zh: {
    nav: {
      home: '首頁',
      products: '商品分類',
      cart: '購物車',
      member: '會員中心',
      categories: '全部分類',
    },
    categories: {
      baby: '母嬰用品',
      cosmetics: '化妝品',
      food: '食品',
      home: '家居',
      apparel: '服飾',
    },
    search: {
      placeholder: '搜索商品...',
      button: '搜索',
    },
    cart: {
      title: '購物車',
      empty: '購物車是空的',
      checkout: '去結算',
      subtotal: '小計',
    },
    product: {
      newArrival: '新品',
      hotSale: '熱銷',
      discount: '折扣',
      originalPrice: '原價',
      viewDetail: '查看詳情',
      addToCart: '加入購物車',
    },
    common: {
      loading: '加載中...',
      error: '加載失敗，請重試',
      confirm: '確認',
      cancel: '取消',
      save: '保存',
      delete: '刪除',
      edit: '編輯',
      submit: '提交',
      back: '返回',
      more: '更多',
      all: '全部',
    },
    footer: {
      aboutUs: '關於我們',
      aboutDesc: '香港生活百貨，提供優質母嬰、化妝品、食品等生活百貨。',
      customerService: '客戶服務',
      faq: '常見問題',
      contactUs: '聯絡客服',
      shippingInfo: '配送說明',
      shoppingGuide: '購物須知',
      paymentMethods: '付款方式',
      returnPolicy: '退換政策',
      membershipTerms: '會員條款',
      contact: '聯絡我們',
      hours: '營業時間：9:00-21:00',
      copyright: '版權所有',
    },
    admin: {
      dashboard: '數據看板',
      productManagement: '商品管理',
      orderManagement: '訂單管理',
      marketingManagement: '營銷管理',
      adminPanel: '後台管理系統',
      logout: '登出',
      admin: '管理員',
    },
  },
  en: {
    nav: {
      home: 'Home',
      products: 'Products',
      cart: 'Cart',
      member: 'Member',
      categories: 'Categories',
    },
    categories: {
      baby: 'Baby & Maternity',
      cosmetics: 'Cosmetics',
      food: 'Food & Grocery',
      home: 'Home & Living',
      apparel: 'Apparel',
    },
    search: {
      placeholder: 'Search products...',
      button: 'Search',
    },
    cart: {
      title: 'Shopping Cart',
      empty: 'Your cart is empty',
      checkout: 'Checkout',
      subtotal: 'Subtotal',
    },
    product: {
      newArrival: 'New',
      hotSale: 'Hot',
      discount: 'Sale',
      originalPrice: 'Was',
      viewDetail: 'View Details',
      addToCart: 'Add to Cart',
    },
    common: {
      loading: 'Loading...',
      error: 'Failed to load, please retry',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      submit: 'Submit',
      back: 'Back',
      more: 'More',
      all: 'All',
    },
    footer: {
      aboutUs: 'About Us',
      aboutDesc:
        'Hong Kong lifestyle department store offering quality baby, beauty, food and home products.',
      customerService: 'Customer Service',
      faq: 'FAQ',
      contactUs: 'Contact Us',
      shippingInfo: 'Shipping Info',
      shoppingGuide: 'Shopping Guide',
      paymentMethods: 'Payment Methods',
      returnPolicy: 'Return Policy',
      membershipTerms: 'Membership Terms',
      contact: 'Contact',
      hours: 'Hours: 9:00-21:00',
      copyright: 'All rights reserved.',
    },
    admin: {
      dashboard: 'Dashboard',
      productManagement: 'Products',
      orderManagement: 'Orders',
      marketingManagement: 'Marketing',
      adminPanel: 'Admin Panel',
      logout: 'Logout',
      admin: 'Admin',
    },
  },
};
