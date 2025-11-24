/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['randomuser.me'],
  },
  env: {
    API_KEY: "AIzaSyC0tcADhabKGITEPCaxfLoAWHcHTm9PYVY",
    AUTH_DOMAIN: "momentu-8ce08.firebaseapp.com",
    PROJECT_ID: "momentu-8ce08",
    STORAGE_BUCKET: "momentu-8ce08.firebasestorage.app",
    MESSAGING_SENDER_ID: "62604099548",
    APP_ID: "1:62604099548:web:da14ab6af712deee3a1919",
    MEASUREMENT_ID: "G-DXW0MPN1W2",
    DATABASE_URL: "https://momentu-8ce08-default-rtdb.firebaseio.com"
  },
  i18n: {
    locales: ["pt-BR"],
    defaultLocale: "pt-BR",
  },
};

module.exports = nextConfig;
